import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { ObjectivesModule } from './objectives/objectives.module';
import { ActivitiesModule } from './activities/activities.module';
import { EventsModule } from './events/events.module';
import { WorkshopsModule } from './workshops/workshops.module';
import { TeamModule } from './team/team.module';
import { ResourcesModule } from './resources/resources.module';
import { GalleryModule } from './gallery/gallery.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { ContactModule } from './contact/contact.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadsModule } from './uploads/uploads.module';
import { AuditModule } from './audit/audit.module';
import { SettingsModule } from './settings/settings.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120, // 120 requests per minute
      },
    ]),
    PrismaModule,
    AuditModule,
    UploadsModule,
    AuthModule,
    UsersModule,
    RolesModule,
    ObjectivesModule,
    ActivitiesModule,
    EventsModule,
    WorkshopsModule,
    TeamModule,
    ResourcesModule,
    GalleryModule,
    AnnouncementsModule,
    ContactModule,
    DashboardModule,
    SettingsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
