import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { employees, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      employeeId: string;
    }>;
  },
) {
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

    const { employeeId } = await context.params;

    const id = Number(employeeId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid employee ID.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
        // --------------------------------------------------
    // ACTIVATE / DEACTIVATE EMPLOYEE
    // --------------------------------------------------

    if (
      body.action === "activate" ||
      body.action === "deactivate"
    ) {
      const isActive = body.action === "activate";

      const employeeResult = await db
        .select({
          id: employees.id,
          userId: employees.userId,
          employeeCode: employees.employeeCode,
        })
        .from(employees)
        .where(eq(employees.id, id))
        .limit(1);

      const employee = employeeResult[0];

      if (!employee) {
        return NextResponse.json(
          {
            success: false,
            message: "Employee not found.",
          },
          { status: 404 },
        );
      }

      // Prevent admin from accidentally changing
      // the employee record without changing the
      // corresponding user login status.
      await db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({
            isActive,
            updatedAt: new Date(),
          })
          .where(eq(users.id, employee.userId));

        await tx
          .update(employees)
          .set({
            isActive,
            updatedAt: new Date(),
          })
          .where(eq(employees.id, id));
      });

      return NextResponse.json({
        success: true,
        message: isActive
          ? "Employee activated successfully."
          : "Employee deactivated successfully.",
        employee: {
          id: employee.id,
          employeeCode: employee.employeeCode,
          isActive,
        },
      });
    }

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

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee name is required.",
        },
        { status: 400 },
      );
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Enter a valid 10-digit Indian mobile number.",
        },
        { status: 400 },
      );
    }

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

    if (joiningDate) {
      const parsedDate = new Date(joiningDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid joining date.",
          },
          { status: 400 },
        );
      }
    }

    const employeeResult = await db
      .select({
        id: employees.id,
        userId: employees.userId,
        employeeCode: employees.employeeCode,
      })
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    const employee = employeeResult[0];

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee not found.",
        },
        { status: 404 },
      );
    }

    const duplicatePhone = await db
      .select({
        id: employees.id,
      })
      .from(employees)
      .where(eq(employees.phone, phone))
      .limit(1);

    if (
      duplicatePhone.length > 0 &&
      duplicatePhone[0].id !== id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another employee already uses this mobile number.",
        },
        { status: 409 },
      );
    }

    if (email) {
      const duplicateEmail = await db
        .select({
          id: users.id,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (
        duplicateEmail.length > 0 &&
        duplicateEmail[0].id !== employee.userId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Another account already uses this email address.",
          },
          { status: 409 },
        );
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          name,
          email: email || null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, employee.userId));

      await tx
        .update(employees)
        .set({
          phone,
          designation: designation || null,
          joiningDate: joiningDate
            ? new Date(joiningDate)
            : null,
          address: address || null,
          updatedAt: new Date(),
        })
        .where(eq(employees.id, id));
    });

    return NextResponse.json({
      success: true,
      message: "Employee updated successfully.",
      employee: {
        id,
        employeeCode: employee.employeeCode,
        name,
        email: email || null,
        phone,
        designation: designation || null,
        joiningDate: joiningDate || null,
        address: address || null,
      },
    });
  } catch (error) {
    console.error(
      "Admin employee PATCH error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update employee.",
      },
      { status: 500 },
    );
  }
}