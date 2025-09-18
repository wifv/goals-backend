// server.js
import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = "./goals.json";

function readGoals() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const data = fs.readFileSync(DATA_FILE, "utf8");
  return data ? JSON.parse(data) : [];
}

function writeGoals(goals) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(goals, null, 2));
}

// POST: Add a new main goal (with optional subGoals)
app.post("/addGoal", (req, res) => {
  const { goal, subGoals } = req.body;
  if (!goal) return res.status(400).json({ error: "Goal is required" });

  let goals = readGoals();
  const newGoal = {
    id: Date.now(),
    goal,
    subGoals: Array.isArray(subGoals) ? subGoals.map(sg => ({
      id: Date.now() + Math.floor(Math.random() * 1000), // unique ID
      goal: sg
    })) : []
  };

  goals.push(newGoal);
  writeGoals(goals);

  res.status(201).json({ message: "Goal added", goal: newGoal });
});

// GET: Get all goals (with subGoals)
app.get("/getGoals", (req, res) => {
  res.json(readGoals());
});

// PUT: Change a main goal text
app.put("/changeGoal/:id", (req, res) => {
  const { id } = req.params;
  const { goal } = req.body;

  let goals = readGoals();
  const index = goals.findIndex((g) => g.id === parseInt(id));
  if (index === -1) return res.status(404).json({ error: "Goal not found" });

  goals[index].goal = goal;
  writeGoals(goals);

  res.json({ message: "Goal updated", goal: goals[index] });
});

// PUT: Change a subGoal text
app.put("/changeSubGoal/:goalId/:subGoalId", (req, res) => {
  const { goalId, subGoalId } = req.params;
  const { goal } = req.body;

  let goals = readGoals();
  const parent = goals.find(g => g.id === parseInt(goalId));
  if (!parent) return res.status(404).json({ error: "Parent goal not found" });

  const subIndex = parent.subGoals.findIndex(sg => sg.id === parseInt(subGoalId));
  if (subIndex === -1) return res.status(404).json({ error: "SubGoal not found" });

  parent.subGoals[subIndex].goal = goal;
  writeGoals(goals);

  res.json({ message: "SubGoal updated", subGoal: parent.subGoals[subIndex] });
});

// DELETE: Delete a main goal
app.delete("/deleteGoal/:id", (req, res) => {
  const { id } = req.params;

  let goals = readGoals();
  const index = goals.findIndex((g) => g.id === parseInt(id));
  if (index === -1) return res.status(404).json({ error: "Goal not found" });

  const deletedGoal = goals.splice(index, 1);
  writeGoals(goals);

  res.json({ message: "Goal deleted", goal: deletedGoal[0] });
});

// DELETE: Delete a subGoal
app.delete("/deleteSubGoal/:goalId/:subGoalId", (req, res) => {
  const { goalId, subGoalId } = req.params;

  let goals = readGoals();
  const parent = goals.find(g => g.id === parseInt(goalId));
  if (!parent) return res.status(404).json({ error: "Parent goal not found" });

  const index = parent.subGoals.findIndex(sg => sg.id === parseInt(subGoalId));
  if (index === -1) return res.status(404).json({ error: "SubGoal not found" });

  const deleted = parent.subGoals.splice(index, 1);
  writeGoals(goals);

  res.json({ message: "SubGoal deleted", subGoal: deleted[0] });
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
