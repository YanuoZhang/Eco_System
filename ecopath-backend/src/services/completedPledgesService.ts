import { randomUUID } from "crypto";
import { pool } from "../config/database";

export interface CompletedPledge {
  id: string;
  userId: string;
  pledgeId: string;
  pledgeType: "public" | "ai_suggestion";
  title: string;
  category?: string;
  icon?: string;
  benefit?: string;
  impact?: string;
  completedAt: string;
  originalRecordId?: string;
  createdAt: string;
}

export interface CompletePledgeRequest {
  userId: string;
  pledgeId: string;
  pledgeType: "public" | "ai_suggestion";
  title: string;
  category?: string;
  icon?: string;
  benefit?: string;
  impact?: string;
  originalRecordId?: string;
}

/**
 * CompletedPledgesService - Service for managing completed pledges
 * Tracks user achievements and allows them to view their completion history
 */
export class CompletedPledgesService {
  /**
   * Get all completed pledges for a specific user
   */
  static async list(userId: string): Promise<CompletedPledge[]> {
    try {
      const query = `
        SELECT 
          id,
          user_id as "userId",
          pledge_id as "pledgeId",
          pledge_type as "pledgeType",
          title,
          category,
          icon,
          benefit,
          impact,
          completed_at as "completedAt",
          original_record_id as "originalRecordId",
          created_at as "createdAt"
        FROM completed_pledges
        WHERE user_id = $1
        ORDER BY completed_at DESC
      `;
      const result = await pool.query(query, [userId]);
      return result.rows.map((row: any) => ({
        id: row.id,
        userId: row.userId,
        pledgeId: row.pledgeId,
        pledgeType: row.pledgeType,
        title: row.title,
        category: row.category,
        icon: row.icon,
        benefit: row.benefit,
        impact: row.impact,
        completedAt: row.completedAt,
        originalRecordId: row.originalRecordId,
        createdAt: row.createdAt,
      }));
    } catch (error) {
      console.error(`Error fetching completed pledges for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Mark a pledge as completed
   */
  static async completePledge(request: CompletePledgeRequest): Promise<CompletedPledge | null> {
    try {
      const id = randomUUID();
      const query = `
        INSERT INTO completed_pledges (
          id,
          user_id,
          pledge_id,
          pledge_type,
          title,
          category,
          icon,
          benefit,
          impact,
          original_record_id,
          completed_at,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING 
          id,
          user_id as "userId",
          pledge_id as "pledgeId",
          pledge_type as "pledgeType",
          title,
          category,
          icon,
          benefit,
          impact,
          completed_at as "completedAt",
          original_record_id as "originalRecordId",
          created_at as "createdAt"
      `;

      const values = [
        id,
        request.userId,
        request.pledgeId,
        request.pledgeType,
        request.title,
        request.category || null,
        request.icon || null,
        request.benefit || null,
        request.impact || null,
        request.originalRecordId || null,
      ];

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      return {
        id: result.rows[0].id,
        userId: result.rows[0].userId,
        pledgeId: result.rows[0].pledgeId,
        pledgeType: result.rows[0].pledgeType,
        title: result.rows[0].title,
        category: result.rows[0].category,
        icon: result.rows[0].icon,
        benefit: result.rows[0].benefit,
        impact: result.rows[0].impact,
        completedAt: result.rows[0].completedAt,
        originalRecordId: result.rows[0].originalRecordId,
        createdAt: result.rows[0].createdAt,
      };
    } catch (error) {
      console.error(`Error completing pledge ${request.pledgeId}:`, error);
      return null;
    }
  }

  /**
   * Get completion statistics for a user
   */
  static async getCompletionStats(userId: string): Promise<{
    totalCompleted: number;
    completedByType: Record<string, number>;
    completedByCategory: Record<string, number>;
    recentCompletions: CompletedPledge[];
  }> {
    try {
      const query = `
        SELECT 
          pledge_type as "pledgeType",
          category,
          COUNT(*) as count
        FROM completed_pledges
        WHERE user_id = $1
        GROUP BY pledge_type, category
        ORDER BY count DESC
      `;

      const recentQuery = `
        SELECT 
          id,
          user_id as "userId",
          pledge_id as "pledgeId",
          pledge_type as "pledgeType",
          title,
          category,
          icon,
          benefit,
          impact,
          completed_at as "completedAt",
          original_record_id as "originalRecordId",
          created_at as "createdAt"
        FROM completed_pledges
        WHERE user_id = $1
        ORDER BY completed_at DESC
        LIMIT 5
      `;

      const [statsResult, recentResult] = await Promise.all([
        pool.query(query, [userId]),
        pool.query(recentQuery, [userId]),
      ]);

      const completedByType: Record<string, number> = {};
      const completedByCategory: Record<string, number> = {};
      let totalCompleted = 0;

      statsResult.rows.forEach((row: any) => {
        const type = row.pledgeType || "unknown";
        const category = row.category || "unknown";
        const count = parseInt(row.count);

        completedByType[type] = (completedByType[type] || 0) + count;
        completedByCategory[category] = (completedByCategory[category] || 0) + count;
        totalCompleted += count;
      });

      const recentCompletions: CompletedPledge[] = recentResult.rows.map((row: any) => ({
        id: row.id,
        userId: row.userId,
        pledgeId: row.pledgeId,
        pledgeType: row.pledgeType,
        title: row.title,
        category: row.category,
        icon: row.icon,
        benefit: row.benefit,
        impact: row.impact,
        completedAt: row.completedAt,
        originalRecordId: row.originalRecordId,
        createdAt: row.createdAt,
      }));

      return {
        totalCompleted,
        completedByType,
        completedByCategory,
        recentCompletions,
      };
    } catch (error) {
      console.error(`Error fetching completion stats for ${userId}:`, error);
      return {
        totalCompleted: 0,
        completedByType: {},
        completedByCategory: {},
        recentCompletions: [],
      };
    }
  }
}
