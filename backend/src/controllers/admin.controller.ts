import { countUsers } from "../lib/app-repository";
import { asyncHandler } from "../utils/async-handler";

export const getAdminOverview = asyncHandler(async (_request, response) => {
  const [totalUsers, admins, members, guests] = await Promise.all([
    countUsers(),
    countUsers("admin"),
    countUsers("member"),
    countUsers("guest")
  ]);

  response.json({
    totalUsers,
    admins,
    members,
    guests
  });
});
