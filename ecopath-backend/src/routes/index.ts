// Routes index - centralize all route imports

import { Router } from "express";
import energyMixRoutes from "./energyMix";
import emissionsRoutes from "./emissions";
import newsRoutes from "./news";
import timelineRoutes from "./timeline";
import statesRoutes from "./states";
import climateTargetsRoutes from "./climateTargets";
import pledgesRoutes from "./pledges";
import communityRoutes from "./community";
import usersRoutes from "./users";
import shareRoutes from "./share";

const router = Router();

// Mount all routes
router.use("/energy-mix", energyMixRoutes);
router.use("/emissions", emissionsRoutes);
router.use("/news", newsRoutes);
router.use("/timeline", timelineRoutes);
router.use("/states", statesRoutes);
router.use("/climate-targets", climateTargetsRoutes);
router.use("/pledges", pledgesRoutes);
router.use("/community", communityRoutes);
router.use("/users", usersRoutes);
router.use(shareRoutes); // Mount directly for /api/share-link routes

export default router;
