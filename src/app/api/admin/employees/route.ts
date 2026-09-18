import { NextResponse } from "next/server";
import { desc, eq, like, or } from "drizzle-orm";

import { db } from "@/db";
import {
  employees,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";

function getNextEmployeeCode(
  existingCodes: string[],
) {
  let maxNumber = 0;

  for (const code of existingCodes) {
    const match = code.match(/^EMP(\d+)$/i);

    if (!match) {
      continue;
    }

    const number = Number(match[1]);

    if (Number.isFinite(number) && number > maxNumber) {
      maxNumber = number;
    }
  }

  return `EMP${String(maxNumber + 1).padStart(3, "0")}`;
}
/**
 * GET
 * Admin only
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Admin access required.",
        },
        { status: 403 },
      );
    }

    const { searchParams } =
      new URL(request.url);

    const search =
      searchParams.get("search")?.trim() || "";

    const employeeList = await db
      .select({
        id: employees.id,

        employeeCode:
          employees.employeeCode,

        name: users.name,

        email: users.email,

        phone: employees.phone,

        designation:
          employees.designation,

        joiningDate:
          employees.joiningDate,

        address:
          employees.address,

        employeeStatus:
          employees.isActive,

        userStatus:
          users.isActive,

        createdAt:
          employees.createdAt,
      })
      .from(employees)
      .innerJoin(
        users,
        eq(employees.userId, users.id),
      )
      .where(
        search
          ? or(
              like(
                employees.employeeCode,
                `%${search}%`,
              ),
              like(
                users.name,
                `%${search}%`,
              ),
              like(
                employees.phone,
                `%${search}%`,
              ),
              like(
                users.email,
                `%${search}%`,
              ),
              like(
                employees.designation,
                `%${search}%`,
              ),
            )
          : undefined,
      )
      .orderBy(
        desc(employees.createdAt),
      );

    return NextResponse.json({
      success: true,
      employees: employeeList,
    });
  } catch (error) {
    console.error(
      "Admin employees GET error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load employees.",
      },
      { status: 500 },
    );
  }
}

/**
 * POST
 * Create employee
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Admin access required.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim()
        : "";

    const designation =
      typeof body.designation === "string"
        ? body.designation.trim()
        : "";

    const joiningDate =
      typeof body.joiningDate === "string"
        ? body.joiningDate.trim()
        : "";

    const address =
      typeof body.address === "string"
        ? body.address.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    // Required name
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Employee name is required.",
        },
        { status: 400 },
      );
    }

    // Phone validation
    if (
      !/^[6-9]\d{9}$/.test(phone)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Enter a valid 10-digit Indian mobile number.",
        },
        { status: 400 },
      );
    }

    // Email validation
    if (email) {
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Enter a valid email address.",
          },
          { status: 400 },
        );
      }
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must be at least 8 characters long.",
        },
        { status: 400 },
      );
    }

    // Check duplicate phone
    const existingPhone =
      await db
        .select({
          id: employees.id,
        })
        .from(employees)
        .where(
          eq(employees.phone, phone),
        )
        .limit(1);

    if (existingPhone.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An employee with this mobile number already exists.",
        },
        { status: 409 },
      );
    }

    // Check duplicate email
    if (email) {
      const existingEmail =
        await db
          .select({
            id: users.id,
          })
          .from(users)
          .where(
            eq(users.email, email),
          )
          .limit(1);

      if (existingEmail.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "An account with this email already exists.",
          },
          { status: 409 },
        );
      }
    }

    // Get latest employee code
    const existingEmployeeCodes = await db
  .select({
    employeeCode: employees.employeeCode,
  })
  .from(employees);

const existingUserCodes = await db
  .select({
    userCode: users.userCode,
  })
  .from(users);

const allExistingCodes = [
  ...existingEmployeeCodes.map(
    (employee) => employee.employeeCode,
  ),
  ...existingUserCodes.map(
    (user) => user.userCode,
  ),
];

const employeeCode =
  getNextEmployeeCode(allExistingCodes);

    const passwordHash =
      await hashPassword(password);

    // Create both records atomically
    const result =
      await db.transaction(
        async (tx) => {
          const userInsert =
            await tx
              .insert(users)
              .values({
                userCode:
                  employeeCode,
                name,
                email:
                  email || null,
                passwordHash,
                role: "EMPLOYEE",
                isActive: true,
              });

          const newUserId =
            Number(
              userInsert[0]
                .insertId,
            );

          const employeeInsert =
            await tx
              .insert(employees)
              .values({
                userId: newUserId,
                employeeCode,
                phone,
                designation:
                  designation || null,
                joiningDate:
                  joiningDate
                    ? new Date(
                        joiningDate,
                      )
                    : null,
                address:
                  address || null,
                isActive: true,
              });

          return {
            userId: newUserId,
            employeeId:
              Number(
                employeeInsert[0]
                  .insertId,
              ),
          };
        },
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Employee created successfully.",
        employee: {
          id: result.employeeId,
          employeeCode,
          name,
          email: email || null,
          phone,
          designation:
            designation || null,
          joiningDate:
            joiningDate || null,
          address:
            address || null,
          status: "ACTIVE",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Admin employees POST error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create employee.",
      },
      { status: 500 },
    );
  }
}