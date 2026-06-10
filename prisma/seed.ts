import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("password123", 10);
  const adminHash = await bcrypt.hash("admin123", 10);

  // 1. Должности
  const positions = await Promise.all([
    prisma.position.create({ data: { name: "Преподаватель", level: 1 } }),
    prisma.position.create({ data: { name: "Зав. ПЦК", level: 2 } }),
    prisma.position.create({ data: { name: "Нач. учебной части", level: 3 } }),
    prisma.position.create({ data: { name: "Инспектор УМР", level: 3 } }),
    prisma.position.create({ data: { name: "Зам. директора по УР", level: 4 } }),
    prisma.position.create({ data: { name: "Директор", level: 5 } }),
    prisma.position.create({ data: { name: "Делопроизводитель", level: 1 } }),
    prisma.position.create({ data: { name: "Администратор системы", level: 99 } }),
  ]);

  const [teacher, zavPck, nachUch, inspektor, zamDir, director, deloproizvod, adminPos] = positions;

  // 2. Отделы
  const departments = await Promise.all([
    prisma.department.create({ data: { name: "ПЦК «Автоматизированные системы»", code: "PKK-AS" } }),
    prisma.department.create({ data: { name: "ПЦК «Электроэнергетика»", code: "PKK-EE" } }),
    prisma.department.create({ data: { name: "ПЦК «Педагогика»", code: "PKK-PED" } }),
    prisma.department.create({ data: { name: "Учебный отдел", code: "UO" } }),
    prisma.department.create({ data: { name: "Администрация", code: "ADMIN" } }),
  ]);

  const newDepartments = await Promise.all([
    prisma.department.create({ data: { name: "ПЦК «Информационные технологии»", code: "PKK-IT" } }),
    prisma.department.create({ data: { name: "ПЦК «Строительство»", code: "PKK-STROY" } }),
    prisma.department.create({ data: { name: "ПЦК «Экономика»", code: "PKK-ECO" } }),
  ]);

  const [depAS, depEE, depPed, depUO, depAdmin, depIT, depStroy, depEco] = [...departments, ...newDepartments];

  // 3. Пользователи + Сотрудники
  const adminUser = await prisma.user.create({
    data: { email: "admin@jak.kg", passwordHash: adminHash, role: "ADMIN" },
  });
  await prisma.employee.create({
    data: { userId: adminUser.id, firstName: "Администратор", lastName: "Системы", positionId: adminPos.id, departmentId: depAdmin.id },
  });

  const createEmployee = async (email: string, role: string, firstName: string, lastName: string, positionId: string, departmentId: string) => {
    const user = await prisma.user.create({ data: { email, passwordHash: hash, role: role as any } });
    await prisma.employee.create({ data: { userId: user.id, firstName, lastName, positionId, departmentId } });
    return user;
  };

  const dirUser = await createEmployee("turdubaeva@jak.kg", "SIGNER", "Б.М.", "Турдубаева", director.id, depAdmin.id);
  const zamUser = await createEmployee("gulperi@jak.kg", "SIGNER", "Гулпери", "Кожобек кызы", zamDir.id, depAdmin.id);
  const nachUser = await createEmployee("abieva@jak.kg", "VALIDATOR", "М.Ш.", "Абиева", nachUch.id, depUO.id);
  const insUser = await createEmployee("kudukbaeva@jak.kg", "VALIDATOR", "Э.", "Кудукбаева", inspektor.id, depUO.id);
  const deloUser = await createEmployee("saparbaeva@jak.kg", "REGISTRAR", "М.М.", "Сапарбаева", deloproizvod.id, depUO.id);
  const teacherUser = await createEmployee("teacher@jak.kg", "INITIATOR", "И.И.", "Учитель", teacher.id, depAS.id);
  const bekovUser = await createEmployee("bekov@jak.kg", "SIGNER", "Э.", "Беков", director.id, depAdmin.id);

  // 4. Workflow шаблоны
  const orderTemplate = await prisma.workflowTemplate.create({
    data: {
      name: "Согласование приказа",
      docType: "ORDER",
      stages: {
        create: [
          { stageOrder: 1, approverPositionId: zavPck.id, deadlineDays: 2 },
          { stageOrder: 2, approverPositionId: nachUch.id, deadlineDays: 2 },
          { stageOrder: 3, approverPositionId: zamDir.id, deadlineDays: 3 },
          { stageOrder: 4, approverPositionId: director.id, deadlineDays: 5 },
          { stageOrder: 5, approverPositionId: deloproizvod.id, deadlineDays: 1 },
        ],
      },
    },
  });

  const memoTemplate = await prisma.workflowTemplate.create({
    data: {
      name: "Согласование служебной записки",
      docType: "MEMO",
      stages: {
        create: [
          { stageOrder: 1, approverPositionId: zavPck.id, deadlineDays: 1 },
          { stageOrder: 2, approverPositionId: zamDir.id, deadlineDays: 2 },
          { stageOrder: 3, approverPositionId: deloproizvod.id, deadlineDays: 1 },
        ],
      },
    },
  });

  const reportTemplate = await prisma.workflowTemplate.create({
    data: {
      name: "Согласование отчёта",
      docType: "REPORT",
      stages: {
        create: [
          { stageOrder: 1, approverPositionId: zavPck.id, deadlineDays: 2 },
          { stageOrder: 2, approverPositionId: nachUch.id, deadlineDays: 2 },
          { stageOrder: 3, approverPositionId: deloproizvod.id, deadlineDays: 1 },
        ],
      },
    },
  });

  // 5. Дополнительные Workflow шаблоны
  await prisma.workflowTemplate.create({
    data: {
      name: "Согласование распоряжения",
      docType: "DIRECTIVE",
      stages: {
        create: [
          { stageOrder: 1, approverPositionId: zavPck.id, deadlineDays: 1 },
          { stageOrder: 2, approverPositionId: zamDir.id, deadlineDays: 2 },
          { stageOrder: 3, approverPositionId: director.id, deadlineDays: 3 },
          { stageOrder: 4, approverPositionId: deloproizvod.id, deadlineDays: 1 },
        ],
      },
    },
  });

  await prisma.workflowTemplate.create({
    data: {
      name: "Согласование протокола",
      docType: "PROTOCOL",
      stages: {
        create: [
          { stageOrder: 1, approverPositionId: zavPck.id, deadlineDays: 1 },
          { stageOrder: 2, approverPositionId: zamDir.id, deadlineDays: 2 },
          { stageOrder: 3, approverPositionId: deloproizvod.id, deadlineDays: 1 },
        ],
      },
    },
  });

  await prisma.workflowTemplate.create({
    data: {
      name: "Согласование акта",
      docType: "ACT",
      stages: {
        create: [
          { stageOrder: 1, approverPositionId: nachUch.id, deadlineDays: 2 },
          { stageOrder: 2, approverPositionId: deloproizvod.id, deadlineDays: 1 },
        ],
      },
    },
  });

  await prisma.workflowTemplate.create({
    data: {
      name: "Согласование договора",
      docType: "CONTRACT",
      stages: {
        create: [
          { stageOrder: 1, approverPositionId: zavPck.id, deadlineDays: 2 },
          { stageOrder: 2, approverPositionId: nachUch.id, deadlineDays: 2 },
          { stageOrder: 3, approverPositionId: zamDir.id, deadlineDays: 3 },
          { stageOrder: 4, approverPositionId: director.id, deadlineDays: 5 },
        ],
      },
    },
  });

  // 6. Демо-документы — сквозной сценарий
  const currentYear = new Date().getFullYear();

  // 6.1. DRAFT — черновик преподавателя
  await prisma.internalDocument.create({
    data: {
      title: "Об организации учебного процесса в 2025-2026 учебном году",
      content: `ПРИКАЗ\n\nОб организации учебного процесса\n\nВ целях организации учебного процесса в ЖАК ЖАГУ на 2025-2026 учебный год,\n\nПРИКАЗЫВАЮ:\n1. Утвердить график учебного процесса.\n2. Назначить ответственных за составление расписания.\n3. Контроль за исполнением возложить на начальника учебной части.`,
      type: "ORDER",
      status: "DRAFT",
      authorId: teacherUser.id,
      workflowId: (await prisma.workflowTemplate.findFirst({ where: { docType: "ORDER" } }))?.id,
    },
  });

  // 6.2. IN_APPROVAL — на согласовании (1-й этап пройден, ждёт нач.учеб.части)
  const approvalDoc = await prisma.internalDocument.create({
    data: {
      title: "О проведении промежуточной аттестации",
      content: `ПРИКАЗ\n\nО проведении промежуточной аттестации студентов\n\nНа основании учебного плана и графика учебного процесса,\n\nПРИКАЗЫВАЮ:\n1. Провести промежуточную аттестацию с 10 по 25 июня 2026 года.\n2. Утвердить состав аттестационных комиссий.\n3. Результаты аттестации предоставить в учебный отдел до 30 июня.`,
      type: "ORDER",
      status: "IN_APPROVAL",
      number: `ORDER-${currentYear}-001`,
      authorId: teacherUser.id,
      workflowId: (await prisma.workflowTemplate.findFirst({ where: { docType: "ORDER" } }))?.id,
    },
  });

  const firstApprovers = await prisma.employee.findMany({
    where: { positionId: zavPck.id },
    include: { user: true },
  });
  for (const emp of firstApprovers) {
    await prisma.documentApproval.create({
      data: { documentId: approvalDoc.id, approverId: emp.user.id, decision: "APPROVE", decidedAt: new Date() },
    });
  }

  const secondApprovers = await prisma.employee.findMany({
    where: { positionId: nachUch.id },
    include: { user: true },
  });
  for (const emp of secondApprovers) {
    await prisma.documentApproval.create({
      data: { documentId: approvalDoc.id, approverId: emp.user.id },
    });
  }

  // 6.3. APPROVED — утверждённый документ
  const approvedDoc = await prisma.internalDocument.create({
    data: {
      title: "Об утверждении графика дежурств",
      content: `РАСПОРЯЖЕНИЕ\n\nОб утверждении графика дежурств\n\nВ целях обеспечения порядка и безопасности в колледже,\n\nОБЯЗЫВАЮ:\n1. Утвердить график дежурств преподавателей на II полугодие 2025-2026 уч.года.\n2. Заведующим ПЦК довести график до сведения преподавателей.\n3. Контроль возложить на заместителя директора по УР.`,
      type: "DIRECTIVE",
      status: "APPROVED",
      number: `DIRECTIVE-${currentYear}-001`,
      authorId: teacherUser.id,
      workflowId: (await prisma.workflowTemplate.findFirst({ where: { docType: "DIRECTIVE" } }))?.id,
    },
  });

  // Добавляем ЭП на утверждённый документ
  const dirEmployee = await prisma.employee.findUnique({ where: { userId: dirUser.id } });
  if (dirEmployee) {
    await prisma.digitalSignature.create({
      data: {
        documentId: approvedDoc.id,
        employeeId: dirEmployee.id,
        userId: dirUser.id,
        signatureData: "dummy:signature:data",
        documentHash: "abcdef1234567890abcdef1234567890",
        isVerified: true,
      },
    });
  }

  // 6.4. MEMO — служебная записка (DRAFT)
  await prisma.internalDocument.create({
    data: {
      title: "О необходимости приобретения оборудования",
      content: `СЛУЖЕБНАЯ ЗАПИСКА\n\nКому: Директору ЖАК ЖАГУ Турдубаевой Б.М.\nОт: Зав. ПЦК «Автоматизированные системы»\n\nПрошу рассмотреть вопрос о приобретении 5 комплектов учебного оборудования для лаборатории «Микропроцессорные системы» на сумму 250 000 сом.`,
      type: "MEMO",
      status: "DRAFT",
      authorId: teacherUser.id,
      workflowId: (await prisma.workflowTemplate.findFirst({ where: { docType: "MEMO" } }))?.id,
    },
  });

  // 6.5. REPORT — отчёт преподавателя (APPROVED)
  await prisma.internalDocument.create({
    data: {
      title: "Отчёт о методической работе за I полугодие 2025-2026 уч.года",
      content: `ОТЧЁТ\n\nО методической работе преподавателя\n\n1. Проведено открытых занятий: 2\n2. Разработано методических пособий: 1\n3. Участие в заседаниях ПЦК: 6\n4. Посещение занятий коллег: 4\n5. Работа с отстающими студентами: индивидуальные консультации (12 часов)`,
      type: "REPORT",
      status: "APPROVED",
      number: `REPORT-${currentYear}-001`,
      authorId: teacherUser.id,
      workflowId: (await prisma.workflowTemplate.findFirst({ where: { docType: "REPORT" } }))?.id,
    },
  });

  // 6.6. Входящие документы
  const registrar = await prisma.employee.findFirst({
    where: { positionId: deloproizvod.id },
    include: { user: true },
  });

  if (registrar) {
    await prisma.incomingDocument.create({
      data: {
        incomingNumber: `ВХ-${currentYear}-001`,
        incomingDate: new Date(),
        fromOrg: "Министерство образования КР",
        title: "О проведении мониторинга качества образования",
        content: "Министерство образования Кыргызской Республики поручает провести мониторинг качества образовательных программ в срок до 1 сентября 2026 года.",
        status: "REGISTERED",
        createdById: registrar.user.id,
      },
    });

    await prisma.incomingDocument.create({
      data: {
        incomingNumber: `ВХ-${currentYear}-002`,
        incomingDate: new Date(Date.now() - 3 * 86400000),
        fromOrg: "ЖАГУ (Ректорат)",
        title: "О предоставлении отчёта по практике студентов",
        outgoingNumber: "01-12/345",
        outgoingDate: new Date(Date.now() - 5 * 86400000),
        status: "UNDER_RESOLUTION",
        resolution: "Начальнику учебной части подготовить отчёт",
        resolutionAuthorId: dirUser.id,
        resolutionDate: new Date(Date.now() - 2 * 86400000),
        executorId: nachUser ? (await prisma.employee.findUnique({ where: { userId: nachUser.id } }))?.id || null : null,
        deadline: new Date(Date.now() + 7 * 86400000),
        createdById: registrar.user.id,
      },
    });

    await prisma.incomingDocument.create({
      data: {
        incomingNumber: `ВХ-${currentYear}-003`,
        incomingDate: new Date(Date.now() - 14 * 86400000),
        fromOrg: "Государственная налоговая служба",
        title: "О предоставлении налоговой отчётности",
        status: "EXECUTED",
        executedAt: new Date(Date.now() - 5 * 86400000),
        resolution: "Бухгалтерии подготовить и сдать отчёт",
        resolutionAuthorId: dirUser.id,
        executorId: registrar.id,
        deadline: new Date(Date.now() - 7 * 86400000),
        createdById: registrar.user.id,
      },
    });
  }

  // 6.7. Версия документа
  const memoDoc = await prisma.internalDocument.findFirst({ where: { type: "MEMO" } });
  if (memoDoc) {
    await prisma.documentVersion.create({
      data: {
        documentId: memoDoc.id,
        version: 1,
        content: memoDoc.content,
        authorId: teacherUser.id,
        changeNote: "Первоначальная версия",
      },
    });
  }

  // 6.8. Уведомления для преподавателя
  await prisma.notification.create({
    data: {
      userId: teacherUser.id,
      type: "APPROVAL_REQUEST",
      title: "Документ отправлен на согласование",
      message: "Ваш документ «О проведении промежуточной аттестации» отправлен на согласование.",
      entityType: "InternalDocument",
      entityId: approvalDoc.id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: teacherUser.id,
      type: "DOCUMENT_SIGNED",
      title: "Документ утверждён",
      message: "Ваш документ «Об утверждении графика дежурств» утверждён директором.",
      entityType: "InternalDocument",
      entityId: approvedDoc.id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: teacherUser.id,
      type: "SYSTEM",
      title: "Добро пожаловать в СЭД ЖАК ЖАГУ",
      message: "Вы успешно зарегистрированы в системе электронного документооборота колледжа.",
    },
  });

  console.log("Seed completed:");
  console.log("=== ADMIN ===");
  console.log("  admin@jak.kg / admin123");
  console.log("=== USERS ===");
  console.log("  turdubaeva@jak.kg / password123 (Директор, SIGNER)");
  console.log("  gulperi@jak.kg / password123 (Зам.директора, SIGNER)");
  console.log("  abieva@jak.kg / password123 (Нач.учеб.части, VALIDATOR)");
  console.log("  kudukbaeva@jak.kg / password123 (Инспектор УМР, VALIDATOR)");
  console.log("  saparbaeva@jak.kg / password123 (Делопроизводитель, REGISTRAR)");
  console.log("  teacher@jak.kg / password123 (Учитель, INITIATOR)");
  console.log("  bekov@jak.kg / password123 (Директор, SIGNER)");
  console.log("=== TEMPLATES ===");
  console.log("  ORDER -> 5 stages");
  console.log("  MEMO -> 3 stages");
  console.log("  REPORT -> 3 stages");
  console.log("  DIRECTIVE -> 4 stages");
  console.log("  PROTOCOL -> 3 stages");
  console.log("  ACT -> 2 stages");
  console.log("  CONTRACT -> 4 stages");
  console.log("=== DEMO DATA ===");
  console.log("  6 documents (DRAFT, IN_APPROVAL, APPROVED x2, MEMO, REPORT)");
  console.log("  3 incoming documents (REGISTERED, RESOLUTION, EXECUTED)");
  console.log("  1 document version, 3 notifications");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
