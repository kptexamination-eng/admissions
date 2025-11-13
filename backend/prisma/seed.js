// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding started...");

  // ---------- 1. Departments ----------
  const departments = [
    { code: "AT", name: "Automobile Engineering" },
    { code: "CE", name: "Civil Engineering" },
    { code: "ME", name: "Mechanical Engineering" },
    { code: "EEE", name: "Electrical and Electronics Engineering" },
    { code: "CH", name: "Chemical Engineering" },
    { code: "PT", name: "Polymer Technology" },
    { code: "EC", name: "Electronics and Communication Engineering" },
    { code: "CS", name: "Computer Science and Engineering" },
  ];

  console.log("➡️  Seeding Departments...");
  for (const d of departments) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    });
  }

  // ---------- 2. Programs ----------
  const programs = [
    { name: "Automobile Engineering", code: "AT", sanctionedIntake: 60 },
    { name: "Civil Engineering", code: "CE", sanctionedIntake: 60 },
    { name: "Mechanical Engineering", code: "ME", sanctionedIntake: 60 },
    {
      name: "Electrical & Electronics Engg.",
      code: "EEE",
      sanctionedIntake: 60,
    },
    { name: "Chemical Engineering", code: "CH", sanctionedIntake: 60 },
    { name: "Polymer Technology", code: "PT", sanctionedIntake: 40 },
    {
      name: "Electronics & Communication Engg.",
      code: "EC",
      sanctionedIntake: 60,
    },
    {
      name: "Computer Science & Engineering",
      code: "CS",
      sanctionedIntake: 60,
    },
  ];

  console.log("➡️  Seeding Programs...");
  for (const p of programs) {
    // find departmentId
    const dept = await prisma.department.findUnique({
      where: { code: p.code },
    });
    await prisma.program.upsert({
      where: { code: p.code },
      update: {},
      create: {
        name: p.name,
        code: p.code,
        durationYears: 3,
        startYear: 1946,
        sanctionedIntake: p.sanctionedIntake,
        departmentId: dept.id,
      },
    });
  }

  // ---------- 3. Batches ----------
  console.log("➡️  Creating Batches (2022, 2023, 2024)...");

  const years = [2022, 2023, 2024];

  for (const p of programs) {
    const program = await prisma.program.findUnique({
      where: { code: p.code },
    });

    for (const year of years) {
      await prisma.batch.upsert({
        where: { programId_year: { programId: program.id, year } },
        update: {},
        create: {
          name: `${year}`,
          year,
          programId: program.id,
        },
      });
    }
  }

  // ---------- 4. Sample Students ----------
  console.log("➡️  Seeding Sample Students...");

  const sampleStudents = [
    {
      registerNo: "103CSE22001",
      firstName: "Anand",
      lastName: "Kumar",
      aadhaarNumber: "456712349876",
      dob: new Date("2005-04-10"),
      gender: "MALE",
      permanentAddress: {
        line1: "12/4 MG Road",
        city: "Mangalore",
        state: "Karnataka",
        postalCode: "575001",
      },
      currentAddress: {
        line1: "Hostel Block A",
        city: "Mangalore",
        state: "Karnataka",
        postalCode: "575002",
      },
      contacts: [
        { name: "Ravi Kumar", relation: "father", phone: "9876543210" },
        { name: "Latha Kumar", relation: "mother", phone: "9876543211" },
      ],
    },
    {
      registerNo: "103ME23002",
      firstName: "Priya",
      lastName: "Sharma",
      aadhaarNumber: "789045612378",
      dob: new Date("2006-09-15"),
      gender: "FEMALE",
      permanentAddress: {
        line1: "55 Gandhi Circle",
        city: "Bangalore",
        state: "Karnataka",
        postalCode: "560001",
      },
      currentAddress: {
        line1: "Hostel Block C",
        city: "Bangalore",
        state: "Karnataka",
        postalCode: "560002",
      },
      contacts: [
        { name: "Mahesh Sharma", relation: "father", phone: "9000011122" },
      ],
    },
  ];

  for (const s of sampleStudents) {
    // find program & batch based on register number
    const deptCode = s.registerNo.substring(3, 6); // "CSE", "ME"
    const year = parseInt("20" + s.registerNo.substring(6, 8)); // "22" → 2022

    const program = await prisma.program.findUnique({
      where: { code: deptCode },
    });
    const batch = await prisma.batch.findUnique({
      where: { programId_year: { programId: program.id, year } },
    });

    // 1. Create Student
    const student = await prisma.student.upsert({
      where: { registerNo: s.registerNo },
      update: {},
      create: {
        registerNo: s.registerNo,
        firstName: s.firstName,
        lastName: s.lastName,
        aadhaarNumber: s.aadhaarNumber,
        dob: s.dob,
        gender: s.gender,
        batchId: batch.id,
        currentSem: 1,
      },
    });

    // 2. Addresses
    const permAddr = await prisma.address.create({
      data: {
        ...s.permanentAddress,
        isPermanent: true,
      },
    });

    const currAddr = await prisma.address.create({
      data: {
        ...s.currentAddress,
        isCurrent: true,
      },
    });

    await prisma.studentAddress.create({
      data: {
        studentId: student.id,
        addressId: permAddr.id,
        type: "permanent",
      },
    });

    await prisma.studentAddress.create({
      data: { studentId: student.id, addressId: currAddr.id, type: "current" },
    });

    // 3. Contacts
    for (const c of s.contacts) {
      const contact = await prisma.contact.create({ data: c });
      await prisma.studentContact.create({
        data: {
          studentId: student.id,
          contactId: contact.id,
          type: c.relation,
        },
      });
    }
  }

  console.log("✅ Seeding completed!");
}

// Run & close Prisma
main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
