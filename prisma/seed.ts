import { PrismaClient, RoleName, EventStatus, AnnouncementStatus, ContactStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seed for UHV Cell TKMCE ---');

  // 1. Roles
  const rolesData = [
    {
      name: RoleName.SUPER_ADMIN,
      description: 'Super Administrator with unrestricted institutional access and user control',
      permissions: ['*'],
    },
    {
      name: RoleName.ADMIN,
      description: 'Institutional administrator for content, events, team, and communications',
      permissions: [
        'objectives:*',
        'activities:*',
        'events:*',
        'workshops:*',
        'team:*',
        'resources:*',
        'gallery:*',
        'announcements:*',
        'contact:*',
        'settings:*',
        'audit:read',
      ],
    },
    {
      name: RoleName.EDITOR,
      description: 'Content Editor capable of managing announcements, activities, and resources',
      permissions: [
        'objectives:read',
        'objectives:write',
        'activities:read',
        'activities:write',
        'events:read',
        'events:write',
        'workshops:read',
        'workshops:write',
        'resources:read',
        'resources:write',
        'gallery:read',
        'gallery:write',
        'announcements:read',
        'announcements:write',
      ],
    },
    {
      name: RoleName.CONTENT_MANAGER,
      description: 'Manager responsible for events, workshops, galleries, and public notices',
      permissions: [
        'events:read',
        'events:write',
        'workshops:read',
        'workshops:write',
        'resources:read',
        'resources:write',
        'gallery:read',
        'gallery:write',
        'announcements:read',
        'announcements:write',
      ],
    },
  ];

  const createdRoles: Record<string, any> = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description, permissions: r.permissions },
      create: r,
    });
    createdRoles[r.name] = role;
  }
  console.log('✓ Initialized Roles');

  // 2. Initial Super Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@tkmce.ac.in';
  const adminRawPassword = process.env.ADMIN_PASSWORD || 'UHV_Tkmce@2026';
  const passwordHash = await bcrypt.hash(adminRawPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      firstName: 'Institutional',
      lastName: 'Administrator',
      roleId: createdRoles[RoleName.SUPER_ADMIN].id,
      isActive: true,
    },
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'Institutional',
      lastName: 'Administrator',
      roleId: createdRoles[RoleName.SUPER_ADMIN].id,
      isActive: true,
    },
  });
  console.log(`✓ Initialized Super Admin user: ${adminUser.email}`);

  // 3. Objectives (Exact AICTE G911 mandate)
  const objectivesData = [
    {
      title: 'Strengthen UHV Infrastructure',
      description: 'To ensure proper infrastructure and structure for UHV Cell as per guidelines of AICTE.',
      order: 1,
      published: true,
    },
    {
      title: 'Define Educational Vision',
      description: 'To articulate, refine & share vision and educational goals, particularly those that are related to Universal Human Values.',
      order: 2,
      published: true,
    },
    {
      title: 'Measure Impact',
      description: 'To define indicators or measures related to Universal Human Values goals & activities.',
      order: 3,
      published: true,
    },
  ];

  await prisma.objective.deleteMany();
  for (const obj of objectivesData) {
    await prisma.objective.create({ data: obj });
  }
  console.log('✓ Seeded 3 Institutional Objectives');

  // 4. Activities (Database-driven as specified in AICTE G911 & TKMCE Charter)
  const activitiesData = [
    {
      title: 'UHV Teaching',
      slug: 'uhv-teaching',
      description: 'To ensure proper teaching of UHV-I of Student Induction Program and UHV-II of 2nd year, through oriented faculty members.',
      icon: 'GraduationCap',
      category: 'Curricular',
      order: 1,
      published: true,
    },
    {
      title: 'Weekly Meetings',
      slug: 'weekly-meetings',
      description: 'To conduct weekly meetings of UHV cell Members along with other Faculty Members, staff and Students interested in UHV.',
      icon: 'Calendar',
      category: 'Coordination',
      order: 2,
      published: true,
    },
    {
      title: 'Faculty Development',
      slug: 'faculty-development',
      description: 'To develop the UHV teachers through advanced UHV FDPs and motivate other faculty members, staff and students to attend the initial level of UHV workshops.',
      icon: 'Users',
      category: 'FDP',
      order: 3,
      published: true,
    },
    {
      title: 'Short Workshops',
      slug: 'short-workshops',
      description: 'To conduct short workshops with faculty members, staff and students on living in harmony and ethical human conduct.',
      icon: 'Sparkles',
      category: 'Workshops',
      order: 4,
      published: true,
    },
    {
      title: 'Learning Resources',
      slug: 'learning-resources',
      description: 'To facilitate availability of common teaching assets like books, lecture presentations and other study materials.',
      icon: 'BookOpen',
      category: 'Library',
      order: 5,
      published: true,
    },
    {
      title: 'Academic Evaluation',
      slug: 'academic-evaluation',
      description: 'To formalize evaluation criteria, examination pattern, projects, term papers, and reflective self-exploration assignments.',
      icon: 'CheckSquare',
      category: 'Academic',
      order: 6,
      published: true,
    },
    {
      title: 'Institutional Coordination',
      slug: 'institutional-coordination',
      description: 'To keep records & maintain communication with concerned UHV bodies like Nodal Centers, Regional Nodal Centers, and AICTE.',
      icon: 'Network',
      category: 'Administration',
      order: 7,
      published: true,
    },
  ];

  await prisma.activity.deleteMany();
  for (const act of activitiesData) {
    await prisma.activity.create({ data: act });
  }
  console.log('✓ Seeded 7 Institutional Activities');

  // 5. Team Members (Faculty Leadership & Student Executive Committee ExeCom 2026–27)
  const teamData = [
    // Faculty Leadership
    {
      name: 'Faculty Coordinator (To be updated)',
      designation: 'Associate Professor / Cell Convener',
      department: 'Faculty Leadership Body',
      role: 'UHV Cell Coordinator',
      bio: 'Profile information to be updated by the institution upon official collegiate gazette.',
      photo: null,
      email: 'uhv.coordinator@tkmce.ac.in',
      phone: null,
      order: 1,
      published: true,
    },
    {
      name: 'Faculty Mentor (To be updated)',
      designation: 'Assistant Professor / Certified UHV-II',
      department: 'Departmental Representation',
      role: 'Faculty Member',
      bio: 'Profile information to be updated upon completion of designated AICTE UHV FDP certification.',
      photo: null,
      email: 'uhv.faculty@tkmce.ac.in',
      phone: null,
      order: 2,
      published: true,
    },

    // I. STUDENT AMBASSADORS (Apex Authority & Cell Representation)
    {
      name: 'Pranav R',
      designation: '4th Year Ambassador (S7)',
      department: 'Mechanical Engineering',
      role: 'Student Ambassador',
      bio: 'Apex authority & cell representation for the graduating engineering batch. Overseeing senior student engagement and institutional liaison.',
      photo: null,
      email: null,
      phone: null,
      order: 10,
      published: true,
    },
    {
      name: 'Anurag PS',
      designation: '3rd Year Ambassador (S5)',
      department: 'Computer Science & Engineering',
      role: 'Student Ambassador',
      bio: 'Apex authority & cell representation for the pre-final year cohort. Coordinating peer mentoring and technical exploration circles.',
      photo: '/assets/execom/anurag_ps.jpg',
      email: null,
      phone: null,
      order: 11,
      published: true,
    },
    {
      name: 'Akshara P R',
      designation: '2nd Year Ambassador (S3)',
      department: 'Mechanical Engineering',
      role: 'Student Ambassador',
      bio: 'Apex authority & cell representation for second-year students. Driving introductory outreach and peer connectivity.',
      photo: '/assets/execom/akshara_pr.jpg',
      email: null,
      phone: null,
      order: 12,
      published: true,
    },

    // II. CORE FUNCTIONAL LEADS (Portfolio Strategy & Coordination)
    {
      name: 'Vaishnav Venugopal',
      designation: 'Media & Design Lead (S7)',
      department: 'Electrical & Electronics (ER)',
      role: 'Core Functional Lead',
      bio: 'Leading creative design, visual identity, digital communication strategy, and branding for collegiate UHV initiatives.',
      photo: null,
      email: null,
      phone: null,
      order: 20,
      published: true,
    },
    {
      name: 'Alby Sunu Joseph',
      designation: 'Program Charting Lead (S3)',
      department: 'Mechanical Engineering',
      role: 'Core Functional Lead',
      bio: 'Responsible for academic calendar alignment, curriculum charting, scheduling value modules, and session timelines.',
      photo: '/assets/execom/alby_sunu_joseph.jpg',
      email: null,
      phone: null,
      order: 21,
      published: true,
    },
    {
      name: 'Namitha Mohanan',
      designation: 'Public Relations (PR) Lead (S3)',
      department: 'Mechanical Engineering',
      role: 'Core Functional Lead',
      bio: 'Managing external communications, student community relations, inter-college invitations, and cell public presence.',
      photo: '/assets/execom/namitha_mohanan.jpg',
      email: null,
      phone: null,
      order: 22,
      published: true,
    },
    {
      name: 'Isha Zikhandher',
      designation: 'Finance & Documentation Lead (S3)',
      department: 'Electronics & Communication',
      role: 'Core Functional Lead',
      bio: 'Overseeing official minutes, financial accounting, workshop documentation, and institutional activity archives.',
      photo: '/assets/execom/isha_zikhandher.jpg',
      email: null,
      phone: null,
      order: 23,
      published: true,
    },

    // III. PROGRAM EXECUTION TEAM (On-Ground Operations & Logistics)
    {
      name: 'Ananthakrishnan',
      designation: 'Program Execution (S5)',
      department: 'Mechanical Engineering',
      role: 'Program Execution Team',
      bio: 'On-ground operational coordination, event logistics management, and facility staging.',
      photo: null,
      email: null,
      phone: null,
      order: 30,
      published: true,
    },
    {
      name: 'Aswin B',
      designation: 'Program Execution (S3)',
      department: 'Electrical & Electronics Engineering',
      role: 'Program Execution Team',
      bio: 'Technical infrastructure, audiovisual support, and venue logistics for value orientation programs.',
      photo: null,
      email: null,
      phone: null,
      order: 31,
      published: true,
    },
    {
      name: 'Devika L Prasanth',
      designation: 'Program Execution (S3)',
      department: 'Mechanical Engineering',
      role: 'Program Execution Team',
      bio: 'Session administration, student participant registration, and feedback collection management.',
      photo: null,
      email: null,
      phone: null,
      order: 32,
      published: true,
    },
    {
      name: 'B Gayathri',
      designation: 'Program Execution (S3)',
      department: 'Electrical & Computer Engineering',
      role: 'Program Execution Team',
      bio: 'Program coordination, participant facilitation, and logistical support for SIP and FDP workshops.',
      photo: '/assets/execom/b_gayathri.jpg',
      email: null,
      phone: null,
      order: 33,
      published: true,
    },
    {
      name: 'Krishnasree P',
      designation: 'Program Execution (S3)',
      department: 'Mechanical Engineering',
      role: 'Program Execution Team',
      bio: 'Venue coordination, material distribution, and hospitality facilitation for invited resource persons.',
      photo: null,
      email: null,
      phone: null,
      order: 34,
      published: true,
    },
    {
      name: 'Shifana Shihab',
      designation: 'Program Execution (S3)',
      department: 'Civil Engineering',
      role: 'Program Execution Team',
      bio: 'Stage management, coordination of student activities, and participant support for interactive exercises.',
      photo: '/assets/execom/shifana_shihab.jpg',
      email: null,
      phone: null,
      order: 35,
      published: true,
    },
    {
      name: 'Reshmi R',
      designation: 'Program Execution (S3)',
      department: 'Civil Engineering',
      role: 'Program Execution Team',
      bio: 'On-ground logistical execution, session flow coordination, and student engagement.',
      photo: '/assets/execom/reshmi_r.jpg',
      email: null,
      phone: null,
      order: 36,
      published: true,
    },
  ];

  await prisma.teamMember.deleteMany();
  for (const tm of teamData) {
    await prisma.teamMember.create({ data: tm });
  }
  console.log('✓ Seeded 16 Team Members (Faculty + ExeCom 2026–27)');

  // 6. Events
  const eventsData = [
    {
      title: '5-Day Faculty Development Programme on Universal Human Values (Level 1)',
      slug: 'aicte-fdp-uhv-level-1',
      description: 'Comprehensive 5-day AICTE recognized Faculty Development Programme focused on understanding human existence, harmony in relationship, society, and nature. Open to all engineering faculty.',
      shortDescription: 'AICTE recognized 5-day FDP focusing on harmony from individual to existence.',
      eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days ahead
      startTime: '09:30 AM',
      endTime: '04:30 PM',
      venue: 'APJ Abdul Kalam Seminar Complex / Online Portal',
      category: 'Faculty Development',
      coverImage: '/assets/event-fdp.jpg',
      registrationUrl: 'https://fdp-si.aicte-india.org/',
      status: EventStatus.UPCOMING,
      featured: true,
      published: true,
    },
    {
      title: 'Student Induction Programme (SIP) - UHV-I Interactive Explorations',
      slug: 'sip-uhv-1-interactive',
      description: 'Mandatory UHV-I introductory exploration modules for incoming first-year undergraduate students, introducing proposals on self-exploration, peer relationships, and family harmony.',
      shortDescription: 'Core induction modules on self-exploration and peer harmony for first-year students.',
      eventDate: new Date(),
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      venue: 'Central Auditorium, TKMCE',
      category: 'Student Workshop',
      coverImage: '/assets/event-sip.jpg',
      registrationUrl: null,
      status: EventStatus.ONGOING,
      featured: true,
      published: true,
    },
    {
      title: 'Orientation Seminar: Harmony in Society and Professional Ethics',
      slug: 'seminar-harmony-society-ethics',
      description: 'In-depth reflective seminar analyzing professional competence, societal harmony, and ethical guidelines in modern engineering disciplines.',
      shortDescription: 'Reflective session on ethical competence and harmony in engineering professions.',
      eventDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      startTime: '02:00 PM',
      endTime: '05:00 PM',
      venue: 'Civil Engineering Seminar Hall',
      category: 'Awareness Programme',
      coverImage: '/assets/event-seminar.jpg',
      registrationUrl: null,
      status: EventStatus.COMPLETED,
      featured: false,
      published: true,
    },
  ];

  await prisma.event.deleteMany();
  for (const ev of eventsData) {
    await prisma.event.create({ data: ev });
  }
  console.log('✓ Seeded 3 Events');

  // 7. Workshops
  const workshopsData = [
    {
      title: 'Workshop on Universal Human Values & Value-Based Technical Education',
      description: 'A 3-day immersive workshop engaging educators in foundational principles of co-existence and the pedagogy of self-exploration in technical curricula.',
      date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      venue: 'Mechanical Seminar Hall, TKMCE',
      organizer: 'UHV Cell in association with AICTE Nodal Centre',
      category: 'UHV Workshop',
      facultyParticipants: 45,
      studentParticipants: 120,
      images: ['/assets/workshop1.jpg'],
      documents: ['/assets/workshop-schedule.pdf'],
      published: true,
    },
    {
      title: 'Faculty Awareness Programme on Holistic Human Health and Harmony',
      description: 'Exploration of physical harmony, self-regulation, and holistic living practices for collegiate faculty and institutional staff.',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      venue: 'Online Hybrid Session',
      organizer: 'UHV Cell, TKM College of Engineering',
      category: 'Faculty Development Programme',
      facultyParticipants: 60,
      studentParticipants: 0,
      images: [],
      documents: [],
      published: true,
    },
  ];

  await prisma.workshop.deleteMany();
  for (const ws of workshopsData) {
    await prisma.workshop.create({ data: ws });
  }
  console.log('✓ Seeded 2 Workshops');

  // 8. Resources
  const resourcesData = [
    {
      title: 'AICTE G911 Reference Document: UHV Cell, Nodal and Resource Centres',
      description: 'Official AICTE policy document outlining the mandate, organizational constitution, objectives, and operations of UHV Cells across technical institutions.',
      category: 'AICTE Guidelines',
      fileUrl: 'https://fdp-si.aicte-india.org/download/G911%20UHV%20Cell,%20Nodal%20and%20Resource%20Centres.pdf',
      fileName: 'G911_UHV_Cell_Nodal_and_Resource_Centres.pdf',
      fileType: 'application/pdf',
      fileSize: 420000,
      downloadCount: 124,
      published: true,
    },
    {
      title: 'TKMCE UHV Cell Institutional Document',
      description: 'Official collegiate reference notification establishing the UHV Cell at TKM College of Engineering.',
      category: 'AICTE Guidelines',
      fileUrl: 'https://tkmce.ac.in/uploads/UHV%20Cell%20(1).pdf',
      fileName: 'UHV_Cell_TKMCE_Official.pdf',
      fileType: 'application/pdf',
      fileSize: 154000,
      downloadCount: 88,
      published: true,
    },
    {
      title: 'A Foundation Course in Human Values and Professional Ethics - Course Overview',
      description: 'Introductory curriculum syllabus, proposal modules, and self-exploration exercises for undergraduate technical programs.',
      category: 'Study Materials',
      fileUrl: 'https://uhv.org.in/uhve',
      fileName: 'Foundation_Course_Human_Values_Overview.pdf',
      fileType: 'application/pdf',
      fileSize: 1250000,
      downloadCount: 215,
      published: true,
    },
    {
      title: 'Student Executive Committee (ExeCom 2026–27) Selection Results & Allotment Order',
      description: 'Official collegiate notification publishing the newly constituted Student Executive Committee (ExeCom 2026–27) across Student Ambassadors, Core Functional Leads, and Program Execution divisions.',
      category: 'Academic Resources',
      fileUrl: '/assets/docs/UHV_ExeCom_Selection_Results_2026-27.pdf',
      fileName: 'UHV_ExeCom_Selection_Results_2026-27.pdf',
      fileType: 'application/pdf',
      fileSize: 45728,
      downloadCount: 68,
      published: true,
    },
  ];

  await prisma.resource.deleteMany();
  for (const res of resourcesData) {
    await prisma.resource.create({ data: res });
  }
  console.log('✓ Seeded 3 Resources');

  // 9. Gallery Albums & Images
  await prisma.galleryImage.deleteMany();
  await prisma.galleryAlbum.deleteMany();

  const album1 = await prisma.galleryAlbum.create({
    data: {
      title: 'UHV Faculty Orientation & Training Circles',
      description: 'Glimpses from faculty development sessions and orientation discussions on value education.',
      coverImage: '/assets/gallery-album-1.jpg',
      published: true,
      images: {
        create: [
          {
            title: 'Reflective Discussion Session',
            caption: 'Faculty members engaging in dialogue on self-exploration proposals.',
            imageUrl: '/assets/gallery-img-1.jpg',
            altText: 'UHV discussion session in seminar hall',
            order: 1,
          },
          {
            title: 'Induction Circle',
            caption: 'Interactive circle connecting students and faculty mentors.',
            imageUrl: '/assets/gallery-img-2.jpg',
            altText: 'Interactive circle discussions',
            order: 2,
          },
        ],
      },
    },
  });

  const album2 = await prisma.galleryAlbum.create({
    data: {
      title: 'Student Induction Programme (SIP) Explorations',
      description: 'Documentation of first-year student participation in Universal Human Values introductory sessions.',
      coverImage: '/assets/gallery-album-2.jpg',
      published: true,
      images: {
        create: [
          {
            title: 'SIP Interactive Seminar',
            caption: 'Students sharing natural acceptance reflections.',
            imageUrl: '/assets/gallery-img-3.jpg',
            altText: 'Students listening to UHV presentation',
            order: 1,
          },
        ],
      },
    },
  });
  console.log('✓ Seeded 2 Gallery Albums with Sample Images');

  // 10. Announcements
  const announcementsData = [
    {
      title: 'Student Executive Committee (ExeCom 2026–27) Official Selection Results Announced',
      slug: 'execom-selection-results-2026-27',
      content: 'Following a comprehensive evaluation of applications, formal interviews, and capability assessments, the Universal Human Values (UHV) Cell is pleased to announce the newly constituted Student Executive Committee (ExeCom 2026–27). The committee comprises Student Ambassadors (Pranav R, Anurag PS, Akshara P R), Core Functional Leads (Vaishnav Venugopal, Alby Sunu Joseph, Namitha Mohanan, Isha Zikhandher), and the Program Execution Team (Ananthakrishnan, Aswin B, Devika L Prasanth, B Gayathri, Krishnasree P, Shifana Shihab, Reshmi R). Hearty congratulations to the selected student leaders!',
      excerpt: 'Official announcement of the newly constituted Student Executive Committee (ExeCom 2026–27) at TKMCE.',
      coverImage: '/assets/announcement-banner.jpg',
      publishedAt: new Date(),
      status: AnnouncementStatus.PUBLISHED,
      featured: true,
    },
    {
      title: 'Constitution of Universal Human Values (UHV) Cell at TKMCE',
      slug: 'constitution-of-uhv-cell-tkmce',
      content: 'In strict accordance with directives from the All India Council for Technical Education (AICTE), TKM College of Engineering has constituted its dedicated Universal Human Values (UHV) Cell. The cell shall coordinate UHV-I and UHV-II curricula, weekly faculty-student study circles, and maintain alignment with AICTE guidelines outlined in G911.',
      excerpt: 'Formal notification regarding the establishment and mandate of the UHV Cell at TKMCE.',
      coverImage: '/assets/announcement-banner.jpg',
      publishedAt: new Date(),
      status: AnnouncementStatus.PUBLISHED,
      featured: true,
    },
    {
      title: 'Upcoming AICTE Approved Online FDP on Human Values',
      slug: 'upcoming-aicte-online-fdp',
      content: 'Nominations are invited from faculty members across all departments for the upcoming AICTE introductory and refresher FDP on Universal Human Values. Interested faculty may consult the UHV Cell coordinator or register directly via the AICTE FDP-SI portal.',
      excerpt: 'Nominations invited for the upcoming AICTE recognized faculty development course.',
      coverImage: null,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: AnnouncementStatus.PUBLISHED,
      featured: false,
    },
    {
      title: 'Weekly Study Circle & Self-Exploration Dialogue Schedule',
      slug: 'weekly-study-circle-schedule',
      content: 'The weekly self-exploration dialogue for faculty, staff, and interested students will be convened every Wednesday at 4:30 PM. Focus areas include relationship harmony and self-verification principles.',
      excerpt: 'Weekly study circle convened every Wednesday for continuous self-exploration dialogue.',
      coverImage: null,
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: AnnouncementStatus.PUBLISHED,
      featured: false,
    },
  ];

  await prisma.announcement.deleteMany();
  for (const ann of announcementsData) {
    await prisma.announcement.create({ data: ann });
  }
  console.log('✓ Seeded 3 Announcements');

  // 11. Site Settings
  const settingsData = [
    { key: 'site_title', value: 'Universal Human Values Cell | TKM College of Engineering', group: 'general' },
    { key: 'site_description', value: 'Promoting ethical, value-based education and holistic development through Universal Human Values at TKMCE.', group: 'general' },
    { key: 'college_name', value: 'TKM College of Engineering', group: 'institution' },
    { key: 'college_address', value: 'Karicode, Kollam, Kerala, India - 691005', group: 'contact' },
    { key: 'contact_email', value: 'uhv@tkmce.ac.in', group: 'contact' },
    { key: 'contact_phone', value: '+91 474 2712024', group: 'contact' },
    { key: 'aicte_g911_url', value: 'https://fdp-si.aicte-india.org/download/G911%20UHV%20Cell,%20Nodal%20and%20Resource%20Centres.pdf', group: 'links' },
    { key: 'tkmce_doc_url', value: 'https://tkmce.ac.in/uploads/UHV%20Cell%20(1).pdf', group: 'links' },
    { key: 'uhv_portal_url', value: 'https://uhv.org.in', group: 'links' },
    { key: 'footer_quote', value: 'Education is not only about acquiring knowledge, but also about developing clarity, responsibility and harmony in life.', group: 'general' },
  ];

  await prisma.siteSetting.deleteMany();
  for (const s of settingsData) {
    await prisma.siteSetting.create({ data: s });
  }
  console.log('✓ Seeded Site Settings');

  // 12. Sample initial audit log entry
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_INITIALIZATION',
      entity: 'System',
      entityId: 'SYSTEM',
      metadata: { note: 'Initial database seeding completed successfully.' },
      ipAddress: '127.0.0.1',
      userAgent: 'PrismaSeed/1.0',
    },
  });
  console.log('✓ Seeded Initial Audit Log');

  console.log('--- Database Seeding Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
