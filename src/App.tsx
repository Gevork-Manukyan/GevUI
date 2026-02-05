import { motion } from "motion/react"
import { AppSwitcher } from "./components/app-switcher"

const DEMO_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#ef4444",
  "#8b5cf6",
]

function DemoCard({
  index,
  color,
}: {
  index: number
  color: string
}) {
  return (
    <motion.div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 12,
        backgroundColor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 24,
        fontWeight: 600,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}
    >
      Card {index + 1}
    </motion.div>
  )
}

export default function App() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ textAlign: "center", marginBottom: 24 }}>
        App Switcher
      </h1>
      <div style={{ width: "100%", maxWidth: 480, height: 320, margin: "0 auto" }}>
        <AppSwitcher stepWidth={100} scaleFactor={0.20}>
          {DEMO_COLORS.map((color, i) => (
            <DemoCard key={i} index={i} color={color} />
          ))}
        </AppSwitcher>
      </div>
    </div>
  )
}
