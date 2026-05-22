export const ROLE_ACCESS = {
  Guest: [
    "Browse public groups",
    "Search places and events",
    "View basic breed information",
    "Submit account registration",
  ],
  Subscriber: [
    "All guest features",
    "Access subscriber dashboard",
    "Create community posts",
    "Submit reviews",
    "Submit event requests",
    "Save favorite places",
    "Opt in for notifications",
  ],
  Provider: [
    "All subscriber features",
    "Request provider access",
    "Edit linked place information",
    "Create promotions",
    "View place performance",
  ],
  Approver: [
    "Review and approve events",
    "Review and approve reviews",
    "Moderate community posts",
    "Approve provider updates",
  ],
  Manager: [
    "All approver features",
    "Manage groups and group types",
    "Manage analytics and audits",
    "View support tickets",
  ],
  Admin: [
    "All manager features",
    "Manage users and roles",
    "Create booster packages",
    "Create rescue centre campaigns",
    "Send push notifications",
    "Manage platform settings",
  ],
  Owner: [
    "Full access to everything",
    "Override permissions",
    "Manage platform-wide audit logs",
    "Manage system-level configuration",
  ],
};

export const dummyUsers = [
  {
    id: 1,
    name: "Alicia Baker",
    email: "alicia@example.com",
    subscription_status: "subscriber",
    roles: ["Subscriber"],
    linked_places: [],
    saved_places: ["Happy Paws Café", "Green Vet Clinic"],
    posted_content: 4,
    active_boosters: ["Visibility Boost"],
  },
  {
    id: 2,
    name: "Darren Roberts",
    email: "darren@provider.co",
    subscription_status: "subscriber",
    roles: ["Provider"],
    linked_places: ["Sunset Pet Lodge"],
    saved_places: ["Live Well Vet"],
    posted_content: 12,
    active_boosters: ["Event Spotlight"],
  },
  {
    id: 3,
    name: "Mia Carter",
    email: "mia.admin@example.com",
    subscription_status: "subscriber",
    roles: ["Admin"],
    linked_places: [],
    saved_places: [],
    posted_content: 0,
    active_boosters: [],
  },
];

export const dummyGroups = [
  { id: 1, name: "Pet Friendly", type: "Service", animal_types: ["Dog", "Cat"] },
  { id: 2, name: "Rescue Centres", type: "Donation", animal_types: ["All"] },
  { id: 3, name: "Medical Services", type: "Health", animal_types: ["Dog", "Cat", "Exotic"] },
];

export const dummyPlaces = [
  {
    id: 1,
    name: "Sunset Pet Lodge",
    groups: ["Pet Friendly", "Rescue Centres"],
    animal_types: ["Dog", "Cat"],
    provider: "Darren Roberts",
    status: "active",
  },
  {
    id: 2,
    name: "Green Vet Clinic",
    groups: ["Medical Services"],
    animal_types: ["Dog", "Cat"],
    provider: "Mia Carter",
    status: "active",
  },
  {
    id: 3,
    name: "Happy Paws Café",
    groups: ["Pet Friendly"],
    animal_types: ["Dog"],
    provider: null,
    status: "active",
  },
];

export const dummyEvents = [
  {
    id: 1,
    title: "Community Pet Adoption Day",
    description: "Help local pets find new homes.",
    date: "2026-06-22T10:00:00Z",
    venue: "Central Park Pavilion",
    location: "Sandton, Johannesburg",
    expiry: "2026-06-23T18:00:00Z",
    status: "upcoming",
    submitted_by: "Subscriber",
    approval_status: "pending",
  },
  {
    id: 2,
    title: "Vet Wellness Workshop",
    description: "Learn how to keep your pets healthy year-round.",
    date: "2026-06-12T14:00:00Z",
    venue: "Green Vet Clinic",
    location: "Durban, KZN",
    expiry: "2026-06-13T18:00:00Z",
    status: "past",
    submitted_by: "Admin",
    approval_status: "approved",
  },
];

export const dummyPosts = [
  {
    id: 1,
    author: "Alicia Baker",
    content: "Found a lovely new dog-friendly park near the river!",
    likes: 23,
    shares: 4,
    created_at: "2026-05-17T09:30:00Z",
    approved: true,
  },
  {
    id: 2,
    author: "Darren Roberts",
    content: "Provider access request submitted for Sunset Pet Lodge.",
    likes: 8,
    shares: 1,
    created_at: "2026-05-18T11:45:00Z",
    approved: false,
  },
];

export const dummyReviews = [
  {
    id: 1,
    user: "Alicia Baker",
    place: "Green Vet Clinic",
    rating: 5,
    comment: "Excellent care and friendly staff.",
    approval_status: "approved",
  },
  {
    id: 2,
    user: "Mia Carter",
    place: "Sunset Pet Lodge",
    rating: 4,
    comment: "Nice location, pending approval.",
    approval_status: "pending",
  },
];

export const dummyDonations = [
  {
    id: 1,
    rescue_center: "Hope Rescue Centre",
    campaign_name: "Winter Warmth Fund",
    status: "active",
    month: "June 2026",
    visibility: "public",
  },
  {
    id: 2,
    rescue_center: "Paws and Claws",
    campaign_name: "Medical Supplies Drive",
    status: "upcoming",
    month: "July 2026",
    visibility: "public",
  },
];

export const dummyBoosterPackages = [
  {
    id: 1,
    name: "Visibility Boost",
    linked_to: "Happy Paws Café",
    expiry_date: "2026-07-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Event Spotlight",
    linked_to: "Community Pet Adoption Day",
    expiry_date: "2026-06-30T00:00:00Z",
  },
];

export const dummySupportTickets = [
  {
    id: 1,
    subject: "Unable to submit event request",
    status: "open",
    created_at: "2026-05-16T13:00:00Z",
  },
  {
    id: 2,
    subject: "Provider access verification",
    status: "in_progress",
    created_at: "2026-05-18T10:30:00Z",
  },
];

export const dummyAnalytics = {
  user_counts: {
    total: 1428,
    subscribers: 870,
    providers: 112,
    admins: 7,
  },
  content_activity: {
    posts: 420,
    events: 38,
    reviews: 112,
  },
  audit_log_summary: {
    actions_today: 24,
    approvals: 8,
    role_changes: 3,
  },
};
