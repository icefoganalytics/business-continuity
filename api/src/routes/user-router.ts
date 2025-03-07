import express, { Request, Response } from "express";
import { param } from "express-validator";

import { UserService } from "../services";
import { ReturnValidationErrors } from "../middleware";
import { User } from "../data/models";

export const userRouter = express.Router();
const db = new UserService();

userRouter.get("/me", async (req: Request, res: Response) => {
  return res.json({ data: req.user });
});

userRouter.get("/", async (req: Request, res: Response) => {
  let list = await db.getAll();

  list.map((u) => {
    if (u.roles) u.roles = (u.roles as string).split(",");
  });

  return res.json({ data: list });
});

userRouter.post("/", async (req: Request, res: Response) => {
  let { user } = req.body;

  if (!user) return res.status(400).send("User not found");

  let existing = await db.getByEmail(user.email);

  if (existing) {
    return res.json({ data: { error: [{ text: "User already exists", variant: "error" }] } });
  }

  let u = {
    department: user.department,
    display_name: user.display_name,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    title: user.title,
    is_active: true,
    auth_subject: user.email,
  } as User;

  await db.create(u).catch((e) => {
    console.log("ERROR CREATE");
    res.json({ data: { error: [{ text: e, variant: "error" }] } });
  });

  return res.json({});
});

userRouter.put(
  "/:id",
  [param("id").notEmpty().isInt()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    let { is_active, department, division, branch, unit, roles } = req.body;

    let existing = await db.getById(id);
    if (!existing) return res.status(404).send("User not found");

    delete existing.roles;
    delete existing.id;

    existing.is_active = is_active;
    existing.department = department;
    existing.division = division;
    existing.branch = branch;
    existing.unit = unit;

    let newRoles = null;

    if (roles) newRoles = roles.join(",");

    existing.roles = newRoles;
    await db.update(id, existing);

    res.json({}).send();
  }
);
