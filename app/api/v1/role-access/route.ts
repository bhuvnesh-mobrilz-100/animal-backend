import { NextRequest, NextResponse } from "next/server";
import {
  ROLE_ACCESS,
  dummyUsers,
  dummyGroups,
  dummyPlaces,
  dummyEvents,
  dummyPosts,
  dummyReviews,
  dummyDonations,
  dummyBoosterPackages,
  dummySupportTickets,
  dummyAnalytics,
} from "@/lib/dummy-data";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    roles: ROLE_ACCESS,
    sampleData: {
      users: dummyUsers,
      groups: dummyGroups,
      places: dummyPlaces,
      events: dummyEvents,
      posts: dummyPosts,
      reviews: dummyReviews,
      donations: dummyDonations,
      boosterPackages: dummyBoosterPackages,
      supportTickets: dummySupportTickets,
      analytics: dummyAnalytics,
    },
  });
}
