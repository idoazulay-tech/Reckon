import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface Item {
  id: number;
  title: string;
  description: string;
  price: number;
  createdAt: string;
}

const items: Item[] = [
  { id: 1, title: "Laptop", description: "High-performance laptop", price: 1299.99, createdAt: new Date().toISOString() },
  { id: 2, title: "Keyboard", description: "Mechanical keyboard", price: 149.99, createdAt: new Date().toISOString() },
  { id: 3, title: "Monitor", description: "4K UHD display", price: 499.99, createdAt: new Date().toISOString() },
];

let nextId = 4;

router.get("/items", (req, res) => {
  req.log.info("List items");
  res.json({ items, total: items.length });
});

router.get("/items/:id", (req, res) => {
  const id = Number(req.params["id"]);
  const item = items.find((i) => i.id === id);
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json({ item });
});

router.post("/items", (req, res) => {
  const { title, description, price } = req.body as {
    title?: string;
    description?: string;
    price?: number;
  };
  if (!title || price === undefined) {
    res.status(400).json({ error: "title and price are required" });
    return;
  }
  const item: Item = {
    id: nextId++,
    title,
    description: description ?? "",
    price: Number(price),
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  req.log.info({ itemId: item.id }, "Item created");
  res.status(201).json({ item });
});

router.put("/items/:id", (req, res) => {
  const id = Number(req.params["id"]);
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  const { title, description, price } = req.body as {
    title?: string;
    description?: string;
    price?: number;
  };
  const item = items[index]!;
  if (title) item.title = title;
  if (description !== undefined) item.description = description;
  if (price !== undefined) item.price = Number(price);
  req.log.info({ itemId: id }, "Item updated");
  res.json({ item });
});

router.delete("/items/:id", (req, res) => {
  const id = Number(req.params["id"]);
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  items.splice(index, 1);
  req.log.info({ itemId: id }, "Item deleted");
  res.json({ message: "Item deleted successfully" });
});

export default router;
