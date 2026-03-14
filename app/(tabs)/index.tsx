import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";

export default function HomeScreen() {
  const months = ["", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const monthLabels = ["All", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const years = ["2022", "2023", "2024", "2025"];

  const [monthIdx, setMonthIdx] = useState(0);
  const [yearIdx, setYearIdx] = useState(3);

  const month = months[monthIdx];
  const year = years[yearIdx];

  const vals = getValuesFor(month, year);

  const cardItems: { key: keyof Values; title: string }[] = [
    { key: "cash", title: "Cash" },
    { key: "gpay", title: "GPay" },
    { key: "total", title: "Total" },
    { key: "invest", title: "Investment" },
  ];

  const getImageUri = (key: keyof Values, title: string) => {
    // Prefer local images (map keys to files in `assets/images`) so bundler loads them.
    const localImages: Partial<Record<keyof Values, any>> = {
      cash: require('../../assets/images/cash.png'),
      gpay: require('../../assets/images/gpay.png'),
      total: require('../../assets/images/total.png'),
      invest: require('../../assets/images/invest.png'),
    };

    if (localImages[key]) return localImages[key];

    // Fallback to a remote placeholder.
    return { uri: `https://via.placeholder.com/135x80?text=${encodeURIComponent(title)}` };
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn}>
            <Image
              source={{ uri: "https://via.placeholder.com/24" }}
              style={{ width: 24, height: 24 }}
            />
          </TouchableOpacity>
        </View>

        {/* CHART */}
        <View style={styles.chartSection}>
          <View style={styles.chartCard}>
            <Text style={{ color: "rgba(255,255,255,0.7)" }}>
              Chart Placeholder
            </Text>
          </View>

          <View style={styles.chartInfo}>
            <Text style={styles.statusText}>In Profit</Text>
            <Text style={styles.chartTitle}>Monthly Income</Text>
            <Text style={styles.amount}>
              Rupee <Text style={styles.whiteText}>{formatCurrency(vals.total)}</Text>
            </Text>
          </View>
        </View>

        {/* PROFIT BANNER */}
        <LinearGradient colors={["#3F8105", "#ACFE3E"]} style={styles.profitBanner}>
          <View style={styles.profitContent}>
            <View style={styles.iconBox}>
              <Image
                source={{ uri: "https://via.placeholder.com/48x30" }}
                style={{ width: 48, height: 30 }}
              />
            </View>

            <Text style={styles.profitText}>ProfitX</Text>
          </View>
        </LinearGradient>

        {/* AMOUNT MENU */}
        <View style={styles.menuSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Amount Menu</Text>

            <View style={styles.filtersRow}>
              <TouchableOpacity
                style={styles.select}
                onPress={() => setMonthIdx((monthIdx + 1) % monthLabels.length)}
              >
                <Text style={styles.selectText}>{monthLabels[monthIdx]}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.select}
                onPress={() => setYearIdx((yearIdx + 1) % years.length)}
              >
                <Text style={styles.selectText}>{year}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => {
                  setMonthIdx(0);
                  setYearIdx(3);
                }}
              >
                <Text style={{ color: "#000" }}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CARDS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {cardItems.map((item) => {
              const value = vals[item.key];

              return (
                <View key={item.key} style={styles.card}>
                  <View style={styles.cardInner}>
                    <View style={styles.displayBox}>
                      <Image
                        source={getImageUri(item.key, item.title)}
                        style={styles.cardImage}
                      />
                    </View>

                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.amountGreen}>
                      {formatCurrency(value)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* TODAY SECTION */}
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>Today</Text>

          <View style={styles.todayCard}>
            <View style={styles.tdisplayBox}>
              <Image
                source={{ uri: "https://via.placeholder.com/80x80" }}
                style={styles.tcardImage}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.meta}>
                Time: <Text style={styles.metaValue}>--:--</Text> | Date:{" "}
                <Text style={styles.metaValue}>--/--/----</Text>
              </Text>

              <Text>
                Profit <Text style={styles.green}>₹{vals.todayProfit}</Text>
              </Text>

              <Text>
                Investment <Text style={styles.yellow}>₹{vals.todayInvest}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* FAB */}
        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.fabMain}>
            <Text style={styles.fabText}>Enter The Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const COLORS = {
  bgDarker: "#0f172a",
  textWhite: "#ffffff",
  textGray: "#94a3b8",
  textGreen: "#84cc16",
  accent: "#84cc16",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgDarker },

  container: { padding: 20, paddingBottom: 120 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  iconBtn: { padding: 6 },

  iconText: { color: COLORS.textGray, fontSize: 22 },

  chartSection: { marginBottom: 20 },

  chartCard: {
    height: 200,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },

  chartInfo: { marginTop: 10 },

  statusText: { color: COLORS.textGreen },

  chartTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textWhite,
  },

  amount: { color: COLORS.textGray },

  whiteText: { color: COLORS.textWhite },

  profitBanner: {
    marginVertical: 20,
    padding: 15,
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50,
    width: "50%",
  },

  profitContent: { flexDirection: "row", alignItems: "center", gap: 10 },

  iconBox: {
    width: 48,
    height: 30,
    backgroundColor: "#000",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  profitText: {
    fontWeight: "700",
    fontSize: 18,
    color: "#352B2A",
  },

  menuSection: { marginTop: 10 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textWhite,
  },

  filtersRow: { flexDirection: "row", gap: 10 },

  select: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#081014",
    borderRadius: 10,
  },

  selectText: { color: COLORS.textWhite },

  filterBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    justifyContent: "center",
    borderRadius: 8,
  },

  card: {
    width: 140,
    height: 180,
    borderRadius: 20,
    backgroundColor: "#111",
    marginRight: 10,
    marginTop: 15,
  },

  cardInner: { alignItems: "center", paddingTop: 10 },

  displayBox: {
    width: "85%",
    height: 80,
    backgroundColor: "#070707",
    borderRadius: 12,
  },

  cardImage: { width: "100%", height: "100%", borderRadius: 12 },

  title: { marginTop: 10, color: COLORS.textWhite },

  amountGreen: { marginTop: 5, color: COLORS.textGreen },

  todaySection: { marginTop: 25 },

  todayCard: {
    flexDirection: "row",
    backgroundColor: "rgba(26,26,26,0.9)",
    padding: 12,
    borderRadius: 16,
    marginTop: 10,
  },

  tdisplayBox: {
    width: 80,
    height: 80,
    backgroundColor: "#070707",
    borderRadius: 12,
    marginRight: 10,
  },

  tcardImage: { width: "100%", height: "100%", borderRadius: 12 },

  meta: { fontSize: 12, color: "#aaa", marginBottom: 5 },

  metaValue: { color: "#fff" },

  green: { color: COLORS.textGreen },

  yellow: { color: "#facc15" },

  fabContainer: { marginTop: 20, alignItems: "center" },

  fabMain: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
  },

  fabText: { color: "#000", fontWeight: "700" },
});

type Values = {
  cash: number;
  gpay: number;
  total: number;
  invest: number;
  todayProfit: number;
  todayInvest: number;
};

function getValuesFor(month: string, year: string): Values {
  const m = month ? parseInt(month, 10) : 0;
  const y = parseInt(year, 10);

  const base = 10000 + (y - 2020) * 2000 + m * 500;

  return {
    cash: base + 2500,
    gpay: base + 1020,
    total: base + 3520,
    invest: base - 500,
    todayProfit: Math.round(base / 10),
    todayInvest: Math.round(base / 20),
  };
}

function formatCurrency(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}