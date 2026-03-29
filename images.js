import data from "./images.json" assert { type: "json" };

export default function handler(req, res) {
  res.status(200).json(data);
}