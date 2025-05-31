export function convertInt16(rawValue: number, decimalPoints = 0): number {
  // 将 16 位无符号数视为 16 位有符号数
  const int16Value = (rawValue << 16) >> 16
  return decimalPoints > 0 ? int16Value / Math.pow(10, decimalPoints) : int16Value
}

export function convertUInt16(rawValue: number, decimalPoints = 0): number {
  return decimalPoints > 0 ? rawValue / Math.pow(10, decimalPoints) : rawValue
}
