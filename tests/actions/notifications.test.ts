jest.mock("@/auth", () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: "user-1", role: "INITIATOR" } }),
}));

import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("createNotification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a notification with required fields", async () => {
    mockPrisma.notification.create.mockResolvedValue({
      id: "notif-1",
      userId: "user-1",
      type: "APPROVAL_REQUEST",
      title: "Test",
      message: "Test message",
      entityType: "InternalDocument",
      entityId: "doc-1",
      isRead: false,
      createdAt: new Date(),
    });

    const { createNotification } = await import("@/actions/notifications");
    const result = await createNotification(
      "user-1",
      "APPROVAL_REQUEST",
      "Test",
      "Test message",
      "InternalDocument",
      "doc-1"
    );

    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "APPROVAL_REQUEST",
        title: "Test",
        message: "Test message",
        entityType: "InternalDocument",
        entityId: "doc-1",
      },
    });
    expect(result).toBeDefined();
  });

  it("should create notification without optional entity fields", async () => {
    mockPrisma.notification.create.mockResolvedValue({
      id: "notif-2",
      userId: "user-1",
      type: "SYSTEM",
      title: "System",
      message: null,
      entityType: null,
      entityId: null,
      isRead: false,
      createdAt: new Date(),
    });

    const { createNotification } = await import("@/actions/notifications");
    await createNotification("user-1", "SYSTEM", "System");

    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "SYSTEM",
        title: "System",
        message: undefined,
        entityType: undefined,
        entityId: undefined,
      },
    });
  });
});

describe("getUnreadCount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the count of unread notifications", async () => {
    mockPrisma.notification.count.mockResolvedValue(5);

    const { getUnreadCount } = await import("@/actions/notifications");
    const result = await getUnreadCount("user-1");

    expect(mockPrisma.notification.count).toHaveBeenCalledWith({
      where: { userId: "user-1", isRead: false },
    });
    expect(result).toBe(5);
  });
});

describe("markAsRead", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should mark a notification as read", async () => {
    mockPrisma.notification.update.mockResolvedValue({
      id: "notif-1",
      userId: "user-1",
      type: "APPROVAL_REQUEST",
      title: "Test",
      message: null,
      entityType: null,
      entityId: null,
      isRead: true,
      createdAt: new Date(),
    });

    const { markAsRead } = await import("@/actions/notifications");
    await markAsRead("notif-1");

    expect(mockPrisma.notification.update).toHaveBeenCalledWith({
      where: { id: "notif-1" },
      data: { isRead: true },
    });
  });
});

describe("markAllAsRead", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should mark all notifications as read for user", async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

    const { markAllAsRead } = await import("@/actions/notifications");
    await markAllAsRead("user-1");

    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", isRead: false },
      data: { isRead: true },
    });
  });
});
