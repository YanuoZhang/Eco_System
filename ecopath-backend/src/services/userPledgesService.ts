import { randomUUID } from "crypto";
import { pool } from "../config/database";
import { RescheduleUserPledgeRequest, SaveUserPledgesRequest, UserPledge } from "../types";

/**
 * UserPledgesService - Database-backed service for managing user pledges
 * Replaces the old JSON file-based storage with PostgreSQL
 */
export class UserPledgesService {
  /**
   * Get all pledges for a specific user
   */
  static async list(userId: string): Promise<UserPledge[]> {
    try {
      const query = `
        SELECT 
          up.id,
          up.user_id as "userId",
          up.reminder_type as "reminderType",
          up.custom_date as "customDate",
          up.created_at as "dateAdded",
          up.completed_at as "completedAt",
          up.is_achievement as "isAchievement",
          up.title,
          up.category
        FROM user_pledges up
        WHERE up.user_id = $1
        ORDER BY up.created_at DESC
      `;
      const result = await pool.query(query, [userId]);
      return result.rows.map((row: any) => ({
        id: row.id,
        userId: row.userId,
        pledgeId: row.title, // Use title as pledgeId
        reminderType: row.reminderType,
        customDate: row.customDate,
        dateAdded: row.dateAdded,
        completedAt: row.completedAt,
        isAchievement: row.isAchievement,
        title: row.title,
        category: row.category,
      }));
    } catch (error) {
      console.error(`Error fetching user pledges for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Save new pledges for a user (batch insert)
   */
  static async save(batch: SaveUserPledgesRequest): Promise<UserPledge[]> {
    try {
      // Get existing pledges for this user
      const existingPledges = await this.list(batch.userId);
      const existingTitles = new Set(existingPledges.map((p) => p.title));

      // Filter out duplicates based on title
      const newPledges = batch.pledges.filter((p) => !existingTitles.has(p.title));

      if (newPledges.length === 0) {
        console.log(`No new pledges to add for user ${batch.userId}`);
        return [];
      }

      const added: UserPledge[] = [];

      // Insert each new pledge
      for (const pledge of newPledges) {
        const id = randomUUID();
        const query = `
          INSERT INTO user_pledges (
            id, 
            user_id, 
            reminder_type, 
            custom_date, 
            title,
            category,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING 
            id,
            user_id as "userId",
            reminder_type as "reminderType",
            custom_date as "customDate",
            title,
            category,
            created_at as "dateAdded"
        `;

        const values = [
          id,
          batch.userId,
          pledge.reminderType || "daily",
          pledge.customDate || null,
          pledge.title || pledge.pledgeId, // Use title if provided, otherwise use pledgeId
          pledge.category || "general", // Default category
        ];

        const result = await pool.query(query, values);

        added.push({
          ...result.rows[0],
          pledgeId: result.rows[0].title, // Use title as pledgeId for compatibility
          isAchievement: false, // New pledges are not achievements
        });
      }

      console.log(`✅ Added ${added.length} new pledges for user ${batch.userId}`);
      return added;
    } catch (error) {
      console.error("Error saving user pledges:", error);
      return [];
    }
  }

  /**
   * Mark a pledge as completed
   * Simply sets is_achievement = true and completed_at = NOW()
   */
  static async markCompleted(
    userId: string,
    recordId: string,
  ): Promise<{
    success: boolean;
    pledgeType?: "public" | "ai_suggestion";
    completedPledge?: any;
    message: string;
  }> {
    try {
      // First, get the pledge details
      const pledgeQuery = `
        SELECT 
          up.id,
          up.user_id as "userId",
          up.reminder_type as "reminderType",
          up.custom_date as "customDate",
          up.created_at as "dateAdded",
          up.title,
          up.category
        FROM user_pledges up
        WHERE up.id = $1 AND up.user_id = $2
      `;

      const pledgeResult = await pool.query(pledgeQuery, [recordId, userId]);

      if (pledgeResult.rows.length === 0) {
        return { success: false, message: "Pledge not found" };
      }

      // const pledgeRow = pledgeResult.rows[0];

      // Mark as achievement by updating the record
      const updateQuery = `
        UPDATE user_pledges 
        SET is_achievement = TRUE, completed_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;

      const updateResult = await pool.query(updateQuery, [recordId, userId]);

      if (updateResult.rows.length === 0) {
        return { success: false, message: "Failed to update pledge" };
      }

      const completedPledge = {
        id: updateResult.rows[0].id,
        userId: updateResult.rows[0].user_id,
        pledgeId: updateResult.rows[0].title, // Use title as pledgeId
        title: updateResult.rows[0].title,
        category: updateResult.rows[0].category,
        completedAt: updateResult.rows[0].completed_at,
        isAchievement: true,
      };

      return {
        success: true,
        pledgeType: "public", // All pledges are now treated the same
        completedPledge,
        message: "Pledge marked as completed",
      };
    } catch (error) {
      console.error(`Error marking pledge ${recordId} as completed:`, error);
      return { success: false, message: "Internal server error" };
    }
  }

  /**
   * Update reminder settings for a specific pledge
   */
  static async reschedule(
    userId: string,
    recordId: string,
    body: RescheduleUserPledgeRequest,
  ): Promise<UserPledge | null> {
    try {
      const query = `
        UPDATE user_pledges
        SET 
          reminder_type = COALESCE($1, reminder_type),
          custom_date = COALESCE($2, custom_date)
        WHERE id = $3 AND user_id = $4
        RETURNING 
          id,
          user_id as "userId",
          title,
          category,
          reminder_type as "reminderType",
          custom_date as "customDate",
          created_at as "dateAdded"
      `;

      const values = [body.reminderType || null, body.customDate || null, recordId, userId];

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        console.log(`Pledge ${recordId} not found for user ${userId}`);
        return null;
      }

      console.log(`✅ Rescheduled pledge ${recordId} for user ${userId}`);
      return {
        ...result.rows[0],
        pledgeId: result.rows[0].title, // Use title as pledgeId for compatibility
      };
    } catch (error) {
      console.error("Error rescheduling user pledge:", error);
      return null;
    }
  }

  /**
   * Remove a pledge for a user
   */
  static async remove(userId: string, recordId: string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM user_pledges
        WHERE id = $1 AND user_id = $2
      `;

      const result = await pool.query(query, [recordId, userId]);
      const deleted = result.rowCount ? result.rowCount > 0 : false;

      if (deleted) {
        console.log(`✅ Removed pledge ${recordId} for user ${userId}`);
      } else {
        console.log(`Pledge ${recordId} not found for user ${userId}`);
      }

      return deleted;
    } catch (error) {
      console.error("Error removing user pledge:", error);
      return false;
    }
  }
}
