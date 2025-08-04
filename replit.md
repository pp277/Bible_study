# Overview

SpiritualPath is a comprehensive spiritual learning management system built as a full-stack React application. The platform enables the creation, organization, and delivery of Bible study content through a structured curriculum hierarchy. It features separate admin and student interfaces, with admins managing content through a hierarchical system of mains (top-level categories), classes (subcategories), and lessons, while students access published lessons, track their progress, and maintain personal bookmarks and notes.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client-side is built with React 18 using TypeScript and follows a component-based architecture. The application uses Wouter for client-side routing and TanStack Query for server state management. The UI is built with Radix UI primitives and styled using Tailwind CSS with a custom design system featuring CSS variables for theming.

Key architectural decisions:
- **Component Organization**: Components are organized by domain (admin, student, auth, common) with shared UI components in a separate directory
- **State Management**: React Context for authentication state, TanStack Query for server state caching and synchronization
- **Routing**: Wouter provides lightweight client-side routing with role-based route protection
- **Styling**: Tailwind CSS with custom design tokens for consistent theming and responsive design

## Backend Architecture

The backend follows a simplified Express.js architecture with a modular storage abstraction. Currently implemented with in-memory storage, the architecture supports easy migration to persistent databases through the IStorage interface.

Key architectural decisions:
- **Storage Abstraction**: IStorage interface allows switching between storage implementations (currently MemStorage, ready for database integration)
- **Route Organization**: Centralized route registration with middleware for logging and error handling
- **Development Setup**: Vite integration for hot module replacement in development
- **Type Safety**: Shared TypeScript schemas between client and server ensure type consistency

## Data Architecture

The application uses a hierarchical content structure with Zod schemas for validation:

**Content Hierarchy**:
- **Mains**: Top-level curriculum categories (e.g., "Old Testament", "New Testament")
- **Classes**: Optional subcategories under mains (e.g., "Genesis", "Matthew")
- **Lessons**: Individual study content with rich text, images, and metadata

**User System**:
- **Users**: Role-based system (admin/user) with authentication tracking
- **Progress Tracking**: Individual lesson progress with completion percentages and study time
- **Bookmarks**: Personal lesson bookmarks with optional notes

## External Dependencies

- **Firebase**: Complete authentication and data persistence solution including:
  - Firebase Auth for user authentication with email/password and Google OAuth
  - Firestore for document-based data storage with real-time capabilities
  - Firebase Storage for image and file uploads
  - Firebase Functions for server-side logic (configured but not actively used)

- **UI Framework**: Radix UI provides accessible, unstyled component primitives for complex interactions like dialogs, dropdowns, and form controls

- **Development Tools**: 
  - Vite for fast development builds and hot module replacement
  - Replit-specific plugins for development environment integration
  - ESBuild for production bundling

- **Database**: PostgreSQL with Drizzle ORM configured for future database migrations (currently using Firebase/in-memory storage)

The architecture prioritizes flexibility and maintainability, with clear separation between authentication (Firebase), data persistence (Firebase/future SQL), and application logic (React/Express). The modular design supports incremental migration from Firebase to traditional database systems if needed.