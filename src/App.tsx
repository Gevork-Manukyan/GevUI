import { useState } from "react"
import { motion } from "motion/react"
import {
  AppSwitcher,
  type AppSwitcherItem,
} from "./components/app-switcher"

const DEMO_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#ef4444",
  "#8b5cf6",
]

function DemoCard({ color, label }: { color: string; label: string }) {
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
      {label}
    </motion.div>
  )
}

function SettingsPage() {
  return (
    <div
      style={{
        padding: 24,
        height: "100%",
        background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        color: "#fff",
        borderRadius: 12,
      }}
    >
      <h2>Settings (component)</h2>
      <p>This view was loaded via item.component. Use the Back button above to return.</p>
    </div>
  )
}

function ProfilePage() {
  return (
    <div
      style={{
        padding: 24,
        height: "100%",
        background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
        color: "#fff",
        borderRadius: 12,
      }}
    >
      <h2>Profile (component)</h2>
      <p>This view was loaded via item.component. Use the Back button above to return.</p>
    </div>
  )
}

export default function App() {
  const [lastPath, setLastPath] = useState<string | null>(null)

  const switcherItems: AppSwitcherItem[] = [
    {
      content: <DemoCard color={DEMO_COLORS[0]} label="Dashboard" />,
      path: "/dashboard",
    },
    {
      content: <DemoCard color={DEMO_COLORS[1]} label="Settings" />,
      path: "/settings",
      component: <SettingsPage />,
    },
    {
      content: <DemoCard color={DEMO_COLORS[2]} label="Profile" />,
      component: <ProfilePage />,
    },
    {
      content: <DemoCard color={DEMO_COLORS[3]} label="Help" />,
      path: "/help",
    },
    {
      content: <DemoCard color={DEMO_COLORS[4]} label="Card 5" />,
    },
  ]

  const handleCardSelect = (_index: number, item?: AppSwitcherItem) => {
    if (item?.path != null) setLastPath(item.path)
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "100vh",
        maxHeight: "100vh",
      }}
    >
      <AppSwitcher
        items={switcherItems}
        stepWidth={200}
        invertScroll={true}
        scaleFactor={0.20}
        fade={true}
        fadeStartDistance={1}
        cardWidth={260}
        cardHeight={280}
        dragTransition={{ power: 0.1, bounceStiffness: 300, bounceDamping: 25 }}
        onCardSelect={handleCardSelect}
      />
      {lastPath != null && (
        <p
          style={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            margin: 0,
            color: "#64748b",
            fontSize: 14,
          }}
        >
          Last selected path: {lastPath} (use path to navigate in a real app)
        </p>
      )}
    </div>
  )
}
