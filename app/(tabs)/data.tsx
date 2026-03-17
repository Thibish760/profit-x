/**
 * DataScreen â€“ Finance Income Entry & History
 * Dark fintech theme Â· Neon green Â· Glassmorphism
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  StatusBar,
  Platform,
  Modal,
  FlatList,
  ImageBackground,
  Image,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient as _LG } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ProfileDrawer from '../../components/ProfileDrawer';
import BottomNavBar from '../../components/BottomNavBar';
import {
  loadFinanceSnapshot,
  saveFinanceSnapshot,
  type AdditionalRow,
  type IncomeRow,
} from '../../constants/finance-storage';

const LinearGradient = _LG as React.ComponentType<any>;
const { width: W } = Dimensions.get('window');
const INCOME_TABLE_MIN_WIDTH = 452;
const WEEKLY_TABLE_MIN_WIDTH = 484;
const TABLE_CARD_WIDTH = W * 0.9;
const TABLE_GAP = 18;

/* â”€â”€â”€ Design tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const NEON        = '#00FF88';
const NEON_DARK   = '#50da2e';
const BG_TOP      = '#000D1A';
const BG_MID      = '#001428';
const BG_BOT      = '#000508';
const CARD_BG     = 'rgba(0,28,56,0.85)';
const CARD_BORDER = 'rgba(0,255,136,0.35)';
const INPUT_BG    = 'rgba(0,10,28,0.90)';
const INPUT_BDR   = 'rgba(255, 255, 255, 0.35)';
const TEXT        = '#FFFFFF';
const MUTED       = 'rgba(255,255,255,0.38)';
const RED         = '#FF3B3B';
const ROW_EVEN    = 'rgba(255,255,255,0.0)';
const ROW_ODD     = 'rgba(255,255,255,0.04)';
const DIVIDER     = 'rgba(255,255,255,0.07)';

const numVal = (v: string) => parseFloat(v) || 0;
const numSum = (vals: string[]) => vals.reduce((s, v) => s + numVal(v), 0);

/* ─── Date picker field ────────────────────────────────────────────────── */
const fmt = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

type DatePickerFieldProps = { label: string; value: string; onChange: (v: string) => void };
const DatePickerField = ({ label, value, onChange }: DatePickerFieldProps) => {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const onPick = (_: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (d) { setTempDate(d); if (Platform.OS === 'android') onChange(fmt(d)); }
  };
  const confirmIOS = () => { onChange(fmt(tempDate)); setShow(false); };

  return (
    <View style={s.labeledField}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TouchableOpacity style={s.dateBtn} onPress={() => setShow(true)} activeOpacity={0.75}>
        <Ionicons name="calendar-outline" size={15} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={[s.dateBtnText, !value && { color: MUTED }]}>
          {value || 'Select date'}
        </Text>
      </TouchableOpacity>

      {/* Android: native dialog */}
      {show && Platform.OS === 'android' && (
        <DateTimePicker mode="date" value={tempDate} display="default" onChange={onPick} />
      )}

      {/* iOS: modal with inline picker */}
      {Platform.OS === 'ios' && (
        <Modal transparent animationType="fade" visible={show} onRequestClose={() => setShow(false)}>
          <TouchableOpacity style={s.pickerOverlay} activeOpacity={1} onPress={() => setShow(false)}>
            <TouchableOpacity activeOpacity={1} style={s.pickerCard} onPress={() => {}}>
              <View style={s.pickerHeader}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={s.pickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={s.pickerTitle}>Select Date</Text>
                <TouchableOpacity onPress={confirmIOS}>
                  <Text style={s.pickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                mode="date"
                value={tempDate}
                display="spinner"
                onChange={onPick}
                textColor={TEXT}
                style={{ width: '100%' }}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

/* ─── Labeled input (matching screenshot) ───────────────────────────────── */
type LabeledInputProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
};
const LabeledInput = ({ label, value, onChangeText, keyboardType = 'default' }: LabeledInputProps) => (
  <View style={s.labeledField}>
    <Text style={s.fieldLabel}>{label}</Text>
    <TextInput
      style={s.fieldInput}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      selectionColor={NEON}
      placeholderTextColor={MUTED}
    />
  </View>
);

/* â”€â”€â”€ Table column config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
// Columns: Date | Invest | Cash | GPay | Profit | Action
const COL = { date: 78, invest: 68, cash: 64, gpay: 64, profit: 72, action: 40 };

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DataScreen
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function DataScreen() {
  const router = useRouter();

  const [incomeForm, setIncomeForm] = useState<Omit<IncomeRow, 'id'>>({
    date: '', cash: '', gpay: '', malliKadai: '', market: '',
  });
  const [addForm, setAddForm] = useState<Omit<AdditionalRow, 'id'>>({
    date: '', egg: '', piece: '', potato: '', gas: '', fuel: '',
  });
  const [addExpanded, setAddExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [incomeRows, setIncomeRows] = useState<IncomeRow[]>([]);
  const [addRows, setAddRows]       = useState<AdditionalRow[]>([]);
  const didHydrateRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      const snapshot = await loadFinanceSnapshot();
      if (!mounted) return;
      setIncomeRows(snapshot.incomeRows);
      setAddRows(snapshot.addRows);
      didHydrateRef.current = true;
    };

    hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!didHydrateRef.current) return;

    saveFinanceSnapshot({ incomeRows, addRows }).catch(() => {
      // Keep UI responsive even if storage write fails.
    });
  }, [incomeRows, addRows]);

  /* â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleUpload = () => {
    if (!incomeForm.date.trim()) { Alert.alert('Required', 'Please enter a date.'); return; }
    setIncomeRows(prev => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...incomeForm }, ...prev]);
    setIncomeForm({ date: '', cash: '', gpay: '', malliKadai: '', market: '' });
  };

  const handleAddEntry = () => {
    if (!addForm.date.trim()) { Alert.alert('Required', 'Please enter a date.'); return; }
    setAddRows(prev => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...addForm }, ...prev]);
    setAddForm({ date: '', egg: '', piece: '', potato: '', gas: '', fuel: '' });
  };

  const confirmDelete = (onDelete: () => void) =>
    Alert.alert('Delete Record', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);

  /* â”€â”€ Totals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const totalCash       = incomeRows.reduce((s, r) => s + numVal(r.cash), 0);
  const totalGPay       = incomeRows.reduce((s, r) => s + numVal(r.gpay), 0);
  const totalMalliKadai = incomeRows.reduce((s, r) => s + numVal(r.malliKadai), 0);
  const totalMarket     = incomeRows.reduce((s, r) => s + numVal(r.market), 0);
  const incomeProfitTotal = totalCash + totalGPay - totalMalliKadai - totalMarket;

  const addTotals = addRows.reduce(
    (a, r) => ({
      egg:    a.egg    + numVal(r.egg),
      piece:  a.piece  + numVal(r.piece),
      potato: a.potato + numVal(r.potato),
      gas:    a.gas    + numVal(r.gas),
      fuel:   a.fuel   + numVal(r.fuel),
    }),
    { egg: 0, piece: 0, potato: 0, gas: 0, fuel: 0 },
  );
  const addGrandTotal = addTotals.egg + addTotals.piece + addTotals.potato + addTotals.gas + addTotals.fuel;

  /* â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  return (
    <LinearGradient colors={['#2c3e50', '#0C1114']} locations={[0, 0.30]} start={[0, 0]} end={[0, 1]} style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={s.safe}>

        {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <View style={s.header}>
          <TouchableOpacity style={s.headerBackBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={TEXT} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Enter the Incomes</Text>
          <TouchableOpacity style={s.profileCircle} onPress={() => setDrawerOpen(true)}>
            <Image source={require('../../assets/images/cornerlogo.png')} style={s.profileImg} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* -- Income Entry Card: gradient border -- */}
          <LinearGradient
            colors={['#49BA20', '#399119', '#42A91D', '#49BA20']}
            start={{ x: 0.12, y: 0.18 }}
            end={{ x: 0.88, y: 0.82 }}
            style={s.incomeCardBorder}
          >
            <ImageBackground
              source={require('../../assets/images/inputlogo.png')}
              style={s.incomeCard}
              imageStyle={{ opacity: 0.10, resizeMode: 'contain' }}
            >
              {/* Card content */}
              <View style={s.cardContent}>
                <Text style={s.enterAmountLabel}>Enter Amount:</Text>

                <DatePickerField label="Date" value={incomeForm.date} onChange={v => setIncomeForm(f => ({ ...f, date: v }))} />
                <LabeledInput label="Cash"         value={incomeForm.cash}        onChangeText={t => setIncomeForm(f => ({ ...f, cash: t }))}        keyboardType="decimal-pad" />
                <LabeledInput label="GPay"         value={incomeForm.gpay}        onChangeText={t => setIncomeForm(f => ({ ...f, gpay: t }))}        keyboardType="decimal-pad" />
                <LabeledInput label="Malli Kadia"  value={incomeForm.malliKadai} onChangeText={t => setIncomeForm(f => ({ ...f, malliKadai: t }))} keyboardType="decimal-pad" />
                <LabeledInput label="Market(Amha)" value={incomeForm.market}      onChangeText={t => setIncomeForm(f => ({ ...f, market: t }))}      keyboardType="decimal-pad" />

                <TouchableOpacity onPress={handleUpload} activeOpacity={0.82} style={{ marginTop: 22 }}>
                  <LinearGradient
                    colors={['#3F8105', '#ACFE3E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.uploadBtn}
                  >
                    <Ionicons name="cloud-upload-outline" size={18} color="#000" />
                    <Text style={s.uploadBtnText}>Upload</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          </LinearGradient>

          {/* â”€â”€ Additional Entry Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <TouchableOpacity
            style={s.addEntryBanner}
            activeOpacity={0.80}
            onPress={() => setAddExpanded(e => !e)}
          >
            {/* Left icon */}
            <View style={s.addIconBox}>
              <Image source={require('../../assets/images/enteryicon.png')} style={s.addIconImage} />
            </View>

            <View style={s.addEntryCenter}>
              <Text style={s.addEntryTitle}>Additional Entry</Text>
              <Text style={s.addEntrySubtitle}>Weekly Things</Text>
            </View>

            {/* Right arrow */}
            <View style={s.addArrowBox}>
              <Entypo name="chevron-small-down" size={20} color="#ffffff" />
            </View>
          </TouchableOpacity>

          {/* â”€â”€ Expanded Additional Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {addExpanded && (
            <LinearGradient
              colors={['#49BA20', '#399119', '#42A91D', '#49BA20']}
              start={{ x: 0.12, y: 0.18 }}
              end={{ x: 0.88, y: 0.82 }}
              style={s.incomeCardBorder}
            >
              <ImageBackground
                source={require('../../assets/images/inputlogo.png')}
                style={s.incomeCard}
                imageStyle={{ opacity: 0.10, resizeMode: 'contain' }}
              >
                <View style={s.cardContent}>
                  <DatePickerField label="Date" value={addForm.date} onChange={v => setAddForm(f => ({ ...f, date: v }))} />
                  <LabeledInput label="Egg"    value={addForm.egg}    onChangeText={t => setAddForm(f => ({ ...f, egg: t }))}    keyboardType="decimal-pad" />
                  <LabeledInput label="Piece"  value={addForm.piece}  onChangeText={t => setAddForm(f => ({ ...f, piece: t }))}  keyboardType="decimal-pad" />
                  <LabeledInput label="Potato" value={addForm.potato} onChangeText={t => setAddForm(f => ({ ...f, potato: t }))} keyboardType="decimal-pad" />
                  <LabeledInput label="Gas"    value={addForm.gas}    onChangeText={t => setAddForm(f => ({ ...f, gas: t }))}    keyboardType="decimal-pad" />
                  <LabeledInput label="Fuel"   value={addForm.fuel}   onChangeText={t => setAddForm(f => ({ ...f, fuel: t }))}   keyboardType="decimal-pad" />
                  <TouchableOpacity onPress={handleAddEntry} activeOpacity={0.82} style={{ marginTop: 16 }}>
                    <LinearGradient
                      colors={['#3F8105', '#ACFE3E']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={s.uploadBtn}
                    >
                      <Ionicons name="add-circle-outline" size={18} color="#000" />
                      <Text style={s.uploadBtnText}>Add Entry</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ImageBackground>
            </LinearGradient>
          )}

          {/* ── Parallel Tables (horizontal container) ───────────────────── */}
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={true}
            decelerationRate="fast"
            snapToAlignment="start"
            snapToInterval={TABLE_CARD_WIDTH + TABLE_GAP}
            contentContainerStyle={s.tablesRow}>
            <View style={s.tableHalf}>
              <Text style={s.sectionLabel}>Income History</Text>
              <View style={s.tableWrap}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  nestedScrollEnabled
                  contentContainerStyle={{ minWidth: INCOME_TABLE_MIN_WIDTH }}>
                  <View>
                    {/* Header */}
                    <View style={s.thRow}>
                      {['Date','Cash','GPay','Malli Kadai','Market','Profit',''].map((h, i) => (
                        <Text key={i} style={[s.th, { width: [72, 60, 60, 80, 64, 64, 36][i] }]}>{h}</Text>
                      ))}
                    </View>
                    {/* Rows */}
                    {incomeRows.length === 0 ? (
                      <View style={s.emptyRow}>
                        <Text style={s.emptyText}>No records yet</Text>
                      </View>
                    ) : (
                      incomeRows.map((r, idx) => {
                        const rowProfit = numVal(r.cash) + numVal(r.gpay) - numVal(r.malliKadai) - numVal(r.market);
                        return (
                          <View key={r.id} style={[s.tdRow, { backgroundColor: idx % 2 === 0 ? ROW_EVEN : ROW_ODD }]}>
                            <Text style={[s.td,       { width: 72 }]}>{r.date}</Text>
                            <Text style={[s.td,       { width: 60 }]}>{r.cash       || '0'}</Text>
                            <Text style={[s.td,       { width: 60 }]}>{r.gpay       || '0'}</Text>
                            <Text style={[s.td,       { width: 80 }]}>{r.malliKadai || '0'}</Text>
                            <Text style={[s.td,       { width: 64 }]}>{r.market     || '0'}</Text>
                            <Text style={[s.tdProfit, { width: 64 }]}>{rowProfit.toFixed(0)}</Text>
                            <TouchableOpacity
                              style={s.deleteBtn}
                              onPress={() => confirmDelete(() => setIncomeRows(p => p.filter(x => x.id !== r.id)))}
                            >
                              <Ionicons name="trash-outline" size={16} color={RED} />
                            </TouchableOpacity>
                          </View>
                        );
                      })
                    )}
                    {/* Column Totals */}
                    {incomeRows.length > 0 && (
                      <View style={s.totalRow}>
                        <Text style={[s.totalCell,       { width: 72 }]}>Total</Text>
                        <Text style={[s.totalCell,       { width: 60 }]}>{totalCash.toFixed(0)}</Text>
                        <Text style={[s.totalCell,       { width: 60 }]}>{totalGPay.toFixed(0)}</Text>
                        <Text style={[s.totalCell,       { width: 80 }]}>{totalMalliKadai.toFixed(0)}</Text>
                        <Text style={[s.totalCell,       { width: 64 }]}>{totalMarket.toFixed(0)}</Text>
                        <Text style={[s.totalCellProfit, { width: 64 }]}>{incomeProfitTotal.toFixed(0)}</Text>
                        <View style={{ width: 36 }} />
                      </View>
                    )}
                  </View>
                </ScrollView>
              </View>
            </View>

            <View style={s.tableHalf}>
              <Text style={s.sectionLabel}>Weekly Entries</Text>
              <View style={s.tableWrap}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  nestedScrollEnabled
                  contentContainerStyle={{ minWidth: WEEKLY_TABLE_MIN_WIDTH }}>
                  <View>
                    {/* Header */}
                    <View style={s.thRow}>
                      {['Date','Egg','Piece','Potato','Gas','Fuel','Total',''].map((h, i) => (
                        <Text key={i} style={[s.th, { width: [72, 56, 60, 64, 56, 56, 64, 36][i] }]}>{h}</Text>
                      ))}
                    </View>
                    {/* Rows */}
                    {addRows.length === 0 ? (
                      <View style={s.emptyRow}>
                        <Text style={s.emptyText}>No records yet</Text>
                      </View>
                    ) : (
                      addRows.map((r, idx) => {
                        const rowTotal = numSum([r.egg, r.piece, r.potato, r.gas, r.fuel]);
                        return (
                          <View key={r.id} style={[s.tdRow, { backgroundColor: idx % 2 === 0 ? ROW_EVEN : ROW_ODD }]}>
                            <Text style={[s.td,       { width: 72 }]}>{r.date}</Text>
                            <Text style={[s.td,       { width: 56 }]}>{r.egg    || '0'}</Text>
                            <Text style={[s.td,       { width: 60 }]}>{r.piece  || '0'}</Text>
                            <Text style={[s.td,       { width: 64 }]}>{r.potato || '0'}</Text>
                            <Text style={[s.td,       { width: 56 }]}>{r.gas    || '0'}</Text>
                            <Text style={[s.td,       { width: 56 }]}>{r.fuel   || '0'}</Text>
                            <Text style={[s.tdProfit, { width: 64 }]}>{rowTotal.toFixed(0)}</Text>
                            <TouchableOpacity
                              style={s.deleteBtn}
                              onPress={() => confirmDelete(() => setAddRows(p => p.filter(x => x.id !== r.id)))}
                            >
                              <Ionicons name="trash-outline" size={16} color={RED} />
                            </TouchableOpacity>
                          </View>
                        );
                      })
                    )}
                    {/* Column Totals */}
                    {addRows.length > 0 && (
                      <View style={s.totalRow}>
                        <Text style={[s.totalCell,       { width: 72 }]}>Total</Text>
                        <Text style={[s.totalCell,       { width: 56 }]}>{addTotals.egg.toFixed(0)}</Text>
                        <Text style={[s.totalCell,       { width: 60 }]}>{addTotals.piece.toFixed(0)}</Text>
                        <Text style={[s.totalCell,       { width: 64 }]}>{addTotals.potato.toFixed(0)}</Text>
                        <Text style={[s.totalCell,       { width: 56 }]}>{addTotals.gas.toFixed(0)}</Text>
                        <Text style={[s.totalCell,       { width: 56 }]}>{addTotals.fuel.toFixed(0)}</Text>
                        <Text style={[s.totalCellProfit, { width: 64 }]}>{addGrandTotal.toFixed(0)}</Text>
                        <View style={{ width: 36 }} />
                      </View>
                    )}
                  </View>
                </ScrollView>
              </View>
            </View>
          </ScrollView>

          <View style={{ height: 120 }} />
        </ScrollView>


        <BottomNavBar />
        <ProfileDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </SafeAreaView>
    </LinearGradient>
  );
}

/* â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  /* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 10,
    paddingBottom: 10,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  profileCircle: {
    padding: 4,
    alignSelf: 'flex-end',
  },
  profileImg: {
    width: 26,
    height: 26,
    borderRadius: 4,
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
  },

  /* â”€â”€ Income entry card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  /* ── Income entry card ──────────────────────────────────────────────────── */
  incomeCardBorder: {
    borderRadius: 18,
    padding: 1.5,
    marginBottom: 14,
    shadowColor: '#49BA20',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 12,
  },
  incomeCard: {
    borderRadius: 17,
    backgroundColor: '#607586',
    overflow: 'hidden',
  },
  cardContent: {
    padding: 18,
    paddingTop: 14,
  },
  enterAmountLabel: {
    color: '#FBFF06',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.3,
  },

  /* â”€â”€ Labeled input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  labeledField: {
    marginTop: 10,
  },
  fieldLabel: {
    color: 'rgb(255, 255, 255)',
    fontSize: 11,
    fontWeight: '400',
    marginBottom: 4,
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  fieldInput: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: INPUT_BDR,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: TEXT,
    fontSize: 14,
    fontWeight: '500',
  },

  /* Upload button */
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  uploadBtnText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.6,
  },

  /* â”€â”€ Additional Entry banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  addEntryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#607586',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ACFE3E',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  addIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(4, 255, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgb(0, 255, 0)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addIconImage: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
  addEntryCenter: {
    flex: 1,
  },
  addEntryTitle: {
    color: '#FBFF06',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  addEntrySubtitle: {
    color: 'rgb(255, 255, 255)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  addArrowBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* â”€â”€ Add form card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  addFormCard: {
    backgroundColor: 'rgba(0,22,48,0.90)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.18)',
    padding: 16,
    marginBottom: 12,
  },

  /* â”€â”€ Section label â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  sectionLabel: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: 6,
    marginBottom: 10,
    marginLeft: 2,
  },

  /* â”€â”€ Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  tableWrap: {
    backgroundColor: 'rgba(0,10,28,0.70)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  tablesRow: {
    marginBottom: 0,
    paddingRight: TABLE_GAP,
    alignItems: 'flex-start',
  },
  tableHalf: {
    width: TABLE_CARD_WIDTH,
    marginRight: TABLE_GAP,
    marginBottom: 16,
  },
  thRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  th: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tdRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    alignItems: 'center',
  },
  td: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 12,
    textAlign: 'center',
  },
  tdProfit: {
    color: '#ACFE3E',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  deleteBtn: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(172,254,62,0.08)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(172,254,62,0.25)',
    alignItems: 'center',
  },
  totalCell: {
    color: '#ACFE3E',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  totalCellProfit: {
    color: '#ACFE3E',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyRow: {
    paddingVertical: 24,
    alignItems: 'center',
    minWidth: '100%',
  },
  emptyText: {
    color: MUTED,
    fontSize: 13,
  },

  /* Date picker */
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgb(41, 183, 19)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateBtnText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '500',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.60)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: '#111C2E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,255,136,0.20)',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  pickerTitle: { color: TEXT, fontWeight: '700', fontSize: 15 },
  pickerCancel: { color: MUTED, fontSize: 14 },
  pickerDone: { color: NEON, fontWeight: '700', fontSize: 14 },

});
