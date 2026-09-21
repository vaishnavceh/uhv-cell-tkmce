export enum RoleName {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum WorkshopCategory {
  UHV_WORKSHOP = 'UHV Workshop',
  FACULTY_DEVELOPMENT = 'Faculty Development Programme',
  STUDENT_WORKSHOP = 'Student Workshop',
  AWARENESS_PROGRAMME = 'Awareness Programme',
  UHV_MEETING = 'UHV Meeting',
}

export enum TeamRole {
  COORDINATOR = 'UHV Cell Coordinator',
  FACULTY_MEMBER = 'Faculty Member',
  UHV_ORIENTED_FACULTY = 'UHV-Oriented Faculty',
  STUDENT_REPRESENTATIVE = 'Student Representative',
}

export enum ResourceCategory {
  UHV_BOOKS = 'UHV Books',
  STUDY_MATERIALS = 'Study Materials',
  AICTE_GUIDELINES = 'AICTE Guidelines',
  WORKSHOP_MATERIALS = 'Workshop Materials',
  ACADEMIC_RESOURCES = 'Academic Resources',
}

export enum AnnouncementStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum ContactStatus {
  NEW = 'NEW',
  READ = 'READ',
  RESPONDED = 'RESPONDED',
  ARCHIVED = 'ARCHIVED',
}

export enum AuditAction {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  EVENT_CREATED = 'EVENT_CREATED',
  EVENT_UPDATED = 'EVENT_UPDATED',
  EVENT_DELETED = 'EVENT_DELETED',
  WORKSHOP_CREATED = 'WORKSHOP_CREATED',
  WORKSHOP_UPDATED = 'WORKSHOP_UPDATED',
  WORKSHOP_DELETED = 'WORKSHOP_DELETED',
  RESOURCE_UPLOADED = 'RESOURCE_UPLOADED',
  RESOURCE_DELETED = 'RESOURCE_DELETED',
  RESOURCE_UPDATED = 'RESOURCE_UPDATED',
  TEAM_UPDATED = 'TEAM_UPDATED',
  GALLERY_UPDATED = 'GALLERY_UPDATED',
  ANNOUNCEMENT_PUBLISHED = 'ANNOUNCEMENT_PUBLISHED',
  ANNOUNCEMENT_CREATED = 'ANNOUNCEMENT_CREATED',
  ANNOUNCEMENT_UPDATED = 'ANNOUNCEMENT_UPDATED',
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
  CONTACT_STATUS_UPDATED = 'CONTACT_STATUS_UPDATED',
}

// User & Auth
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: RoleName;
    description: string;
  };
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

// Objective
export interface Objective {
  id: string;
  title: string;
  description: string;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Activity
export interface Activity {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Event
export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  eventDate: string;
  startTime?: string | null;
  endTime?: string | null;
  venue: string;
  category: string;
  coverImage?: string | null;
  registrationUrl?: string | null;
  status: EventStatus;
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Workshop
export interface Workshop {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  organizer: string;
  category: string;
  facultyParticipants: number;
  studentParticipants: number;
  images: string[];
  documents: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Team Member
export interface TeamMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  role: string;
  bio?: string | null;
  photo?: string | null;
  email?: string | null;
  phone?: string | null;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Resource
export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  thumbnail?: string | null;
  downloadCount: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Gallery
export interface GalleryImage {
  id: string;
  albumId: string;
  title: string;
  caption?: string | null;
  imageUrl: string;
  altText?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  published: boolean;
  images?: GalleryImage[];
  _count?: {
    images: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Announcement
export interface Announcement {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  coverImage?: string | null;
  publishedAt?: string | null;
  status: AnnouncementStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

// Contact Message
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  responseNotes?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Audit Log
export interface AuditLogItem {
  id: string;
  userId?: string | null;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

// Site Settings
export interface SiteSettingItem {
  id: string;
  key: string;
  value: string;
  group: string;
  createdAt: string;
  updatedAt: string;
}

// Standard API Responses
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
