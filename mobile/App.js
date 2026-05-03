// Expanding Tic Tac Toe — React Native (Expo) App
import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  Animated,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getInitialState, applyTurn } from '../shared/gameLogic.js';

// --- Theme ---
const theme = {
  bg: '#0f0f1a',
  surface: '#1a1a2e',
  border: '#2e2e5a',
  accentX: '#e94560',
  accentO: '#0f9bff',
  text: '#e8e8f0',
  textMuted: '#8888aa',
};

// --- Cell component ---
const Cell = React.memo(({ value, onPress, cellSize, isNew, disabled }) => {
  const color = value === 'X' ? theme.accentX : value === 'O' ? theme.accentO : 'transparent';
  const scale = useRef(new Animated.Value(value ? 0 : 1)).current;

  React.useEffect(() => {
    if (value) {
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }).start();
    }
  }, [value]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!!value || disabled}
      style={[
        styles.cell,
        { width: cellSize, height: cellSize, borderRadius: cellSize * 0.12 },
        isNew && styles.cellNew,
      ]}
      activeOpacity={0.7}
    >
      <Animated.Text style={[styles.cellText, { color, fontSize: cellSize * 0.42, transform: [{ scale }] }]}>
        {value || ''}
      </Animated.Text>
    </TouchableOpacity>
  );
});

// --- Segmented toggle helper ---
const SegmentedToggle = ({ options, value, onChange }) => (
  <View style={styles.modeToggle}>
    {options.map(({ key, label }, i) => (
      <TouchableOpacity
        key={key}
        style={[styles.modeBtn, i > 0 && styles.modeBtnBorder, value === key && styles.modeBtnActive]}
        onPress={() => onChange(key)}
        activeOpacity={0.8}
      >
        <Text style={[styles.modeBtnText, value === key && styles.modeBtnTextActive]}>{label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// --- Main App ---
export default function App() {
  const [expandMode, setExpandMode] = useState('by2');
  const [winMode, setWinMode]       = useState('fixed');
  const [manualStreak, setManualStreak] = useState(3);
  const [houseRuleNoDecrease, setHouseRuleNoDecrease] = useState(false);
  const [gameState, setGameState]   = useState(getInitialState('by2', 'fixed', 3));
  const [lastExpanded, setLastExpanded] = useState(false);
  const { width } = useWindowDimensions();

  const { board, currentPlayer, winner, size, expanding, streak } = gameState;

  const padding  = 32;
  const cellSize = Math.min(Math.floor((width - padding) / size) - 4, 88);

  const handlePress = useCallback((row, col) => {
    setGameState((prev) => {
      const next = applyTurn(prev, row, col);
      setLastExpanded(next.expanding);
      if (next.expanding) setManualStreak(next.streak);
      return next;
    });
  }, []);

  const handleNewGame = useCallback(() => {
    const streak = winMode === 'manual' ? manualStreak : 3;
    setGameState(getInitialState(expandMode, winMode, streak));
    setLastExpanded(false);
  }, [expandMode, winMode, manualStreak]);

  const handleExpandModeChange = useCallback((mode) => {
    setExpandMode(mode);
    const wm = mode === 'by1' ? 'fixed' : winMode;
    if (mode === 'by1') { setWinMode('fixed'); setManualStreak(3); }
    setGameState(getInitialState(mode, wm, 3));
    setLastExpanded(false);
  }, [winMode]);

  const handleWinModeChange = useCallback((mode) => {
    setWinMode(mode);
    // Keep the current streak when switching to manual; reset to 3 when switching away.
    const newStreak = mode !== 'manual' ? 3 : manualStreak;
    if (mode !== 'manual') setManualStreak(3);
    setGameState((prev) => ({ ...prev, winMode: mode, streak: newStreak }));
  }, [manualStreak]);

  const handleStreakInput = useCallback((text) => {
    const val = parseInt(text, 10);
    if (!isNaN(val)) {
      // Hard cap: streak must be < board size (otherwise game is unwinnable)
      const floor   = houseRuleNoDecrease ? streak : 3;
      const clamped = Math.max(floor, Math.min(val, size - 1));
      setManualStreak(clamped);
      setGameState((prev) => ({ ...prev, streak: clamped }));
    }
  }, [size, streak, houseRuleNoDecrease]);

  const inputUnlocked = winMode === 'manual' && gameState.awaitingFirstMove;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text style={styles.title}>Expanding Tic Tac Toe</Text>
        <Text style={styles.subtitle}>
          Fill the board to expand it. First {streak}-in-a-row wins.
        </Text>

        {/* Status */}
        {winner ? (
          <View style={styles.winnerBanner}>
            <View style={[styles.badge, { backgroundColor: winner === 'X' ? theme.accentX : theme.accentO }]}>
              <Text style={styles.badgeText}>{winner}</Text>
            </View>
            <Text style={styles.winnerText}>Player {winner} wins!</Text>
          </View>
        ) : (
          <View style={styles.statusBar}>
            <Text style={styles.statusText}>Player </Text>
            <View style={[styles.badge, { backgroundColor: currentPlayer === 'X' ? theme.accentX : theme.accentO }]}>
              <Text style={styles.badgeText}>{currentPlayer}</Text>
            </View>
            <Text style={styles.statusText}>'s turn</Text>
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>{streak}-in-a-row</Text>
            </View>
          </View>
        )}

        {lastExpanded && (
          <Text style={styles.expandNotice}>Board expanded to {size}×{size}</Text>
        )}

        {/* Board */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.boardWrapper}>
            {board.map((row, ri) => (
              <View key={ri} style={styles.row}>
                {row.map((cell, ci) => (
                  <Cell
                    key={`${ri}-${ci}`}
                    value={cell}
                    cellSize={cellSize}
                    onPress={() => handlePress(ri, ci)}
                    disabled={!!winner}
                    isNew={
                      expanding && (
                        expandMode === 'by1'
                          ? ri === size - 1 || ci === size - 1
                          : ri === 0 || ri === size - 1 || ci === 0 || ci === size - 1
                      )
                    }
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.boardSize}>{size}×{size} board</Text>

        {/* Expand mode toggle */}
        <View style={styles.modeSection}>
          <Text style={styles.modeLabel}>Expand by</Text>
          <SegmentedToggle
            options={[
              { key: 'by2', label: '+2  (3→5→7…)' },
              { key: 'by1', label: '+1  (3→4→5…)' },
            ]}
            value={expandMode}
            onChange={handleExpandModeChange}
          />
        </View>

        {/* Win mode toggle — only shown for by2 */}
        {expandMode === 'by2' && (
          <View style={styles.modeSection}>
            <Text style={styles.modeLabel}>Win condition</Text>
            <SegmentedToggle
              options={[
                { key: 'fixed',   label: 'Fixed (3)' },
                { key: 'scaling', label: 'Scaling +1' },
                { key: 'manual',  label: 'Manual' },
              ]}
              value={winMode}
              onChange={handleWinModeChange}
            />

            {/* Manual streak input */}
            {winMode === 'manual' && (
              <View style={styles.manualSection}>
                <View style={styles.manualInputRow}>
                  <Text style={[styles.modeLabel, { marginRight: 6 }]}>In-a-row needed:</Text>
                  <TextInput
                    style={[styles.streakInput, !inputUnlocked && styles.streakInputDisabled]}
                    keyboardType="number-pad"
                    value={String(streak)}
                    editable={inputUnlocked}
                    onChangeText={handleStreakInput}
                    selectTextOnFocus
                  />
                </View>
                <Text style={[styles.streakHint, inputUnlocked && styles.streakHintUnlocked]}>
                  {inputUnlocked
                    ? `Enter ${houseRuleNoDecrease ? streak : 3}–${size - 1}`
                    : 'Unlocks after expansion'}
                </Text>
                <View style={styles.houseRuleRow}>
                  <Switch
                    value={houseRuleNoDecrease}
                    onValueChange={setHouseRuleNoDecrease}
                    trackColor={{ false: theme.border, true: theme.accentO }}
                    thumbColor="#fff"
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                  <Text style={styles.houseRuleText}>
                    House rule: streak can only increase
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* New game button */}
        <TouchableOpacity style={styles.newGameBtn} onPress={handleNewGame} activeOpacity={0.8}>
          <Text style={styles.newGameText}>New Game</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:       { flex: 1, backgroundColor: theme.bg },
  container:      { alignItems: 'center', padding: 20, gap: 16, paddingBottom: 48 },
  title:          { fontSize: 26, fontWeight: '800', color: theme.accentX, letterSpacing: -0.5, marginTop: 8 },
  subtitle:       { fontSize: 13, color: theme.textMuted, textAlign: 'center' },
  statusBar:      { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  statusText:     { fontSize: 16, fontWeight: '600', color: theme.text },
  badge:          { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText:      { color: '#fff', fontWeight: '900', fontSize: 16 },
  streakBadge:    {
    backgroundColor: 'rgba(15,155,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(15,155,255,0.3)',
    borderRadius: 99,
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  streakBadgeText: { fontSize: 11, fontWeight: '700', color: theme.accentO },
  winnerBanner:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  winnerText:     { fontSize: 18, fontWeight: '700', color: theme.text },
  expandNotice:   { fontSize: 13, color: theme.accentO, fontWeight: '600' },
  boardWrapper:   { gap: 4 },
  row:            { flexDirection: 'row', gap: 4, marginBottom: 4 },
  cell:           { backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  cellNew:        { opacity: 0.6, borderStyle: 'dashed' },
  cellText:       { fontWeight: '900' },
  boardSize:      { fontSize: 12, color: theme.textMuted, letterSpacing: 0.5, marginTop: 4 },
  modeSection:    { alignItems: 'center', gap: 6, marginTop: 4, width: '100%' },
  modeLabel:      { fontSize: 12, color: theme.textMuted, fontWeight: '600' },
  modeToggle:     { flexDirection: 'row', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 10, overflow: 'hidden', flexWrap: 'wrap' },
  modeBtn:        { paddingVertical: 7, paddingHorizontal: 14 },
  modeBtnBorder:  { borderLeftWidth: 1, borderLeftColor: theme.border },
  modeBtnActive:  { backgroundColor: theme.accentX },
  modeBtnText:    { fontSize: 12, fontWeight: '600', color: theme.textMuted },
  modeBtnTextActive: { color: '#fff' },
  manualSection:  { flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 4 },
  manualInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  houseRuleRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  houseRuleText:  { fontSize: 12, color: theme.textMuted, flexShrink: 1 },
  streakInput:    { width: 56, paddingVertical: 5, paddingHorizontal: 8, backgroundColor: theme.surface, color: theme.text, borderWidth: 1.5, borderColor: theme.accentO, borderRadius: 8, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  streakInputDisabled: { borderColor: theme.border, opacity: 0.4 },
  streakHint:     { fontSize: 11, color: theme.textMuted, fontStyle: 'italic' },
  streakHintUnlocked: { color: theme.accentO, fontStyle: 'normal', fontWeight: '600' },
  newGameBtn:     { marginTop: 8, paddingVertical: 12, paddingHorizontal: 36, borderRadius: 12, backgroundColor: theme.accentX },
  newGameText:    { color: '#fff', fontWeight: '700', fontSize: 16 },
});
