/**
 * TCSS 343
 * 8/1/2026
 * Search Algorithms Demo
 *
 * Server
 *
 * @author Landon Wardle
 *
 * @version 1.0
 */

import express from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(import.meta.dirname, "views"));

app.use(express.static("public"));
app.use(express.json());

app.get("/", function (req, res) {
  res.render("index", {
    title: "Home - Campus Vision",
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running at http://localhost:${PORT}`);
});
