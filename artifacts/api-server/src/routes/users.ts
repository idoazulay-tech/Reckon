import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

const users: User[] = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", createdAt: new Date().toISOString() },
  { id: 2, name: "Bob Smith", email: "bob@example.com", createdAt: new Date().toISOString() },
  { id: 3, name: "Carol White", email: "carol@example.com", createdAt: new Date().toISOString() },
];

let nextId = 4;

router.get("/users", (req, res) => {
  req.log.info("List users");
  res.json({ users, total: users.length });
});

router.get("/users/:id", (req, res) => {
  const id = Number(req.params["id"]);
  const user = users.find((u) => u.id === id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

router.post("/users", (req, res) => {
  const { name, email } = req.body as { name?: string; email?: string };
  if (!name || !email) {
    res.status(400).json({ error: "name and email are required" });
    return;
  }
  const user: User = {
    id: nextId++,
    name,
    email,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  req.log.info({ userId: user.id }, "User created");
  res.status(201).json({ user });
});

router.put("/users/:id", (req, res) => {
  const id = Number(req.params["id"]);
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const { name, email } = req.body as { name?: string; email?: string };
  const user = users[index]!;
  if (name) user.name = name;
  if (email) user.email = email;
  req.log.info({ userId: id }, "User updated");
  res.json({ user });
});

router.delete("/users/:id", (req, res) => {
  const id = Number(req.params["id"]);
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  users.splice(index, 1);
  req.log.info({ userId: id }, "User deleted");
  res.json({ message: "User deleted successfully" });
});

export default router;
