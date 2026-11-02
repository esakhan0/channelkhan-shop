export const getPercentageDiff = (original: number, calculated: number) => {
  if (original <= 0) return "0"
  const diff = original - calculated
  const decrease = (diff / original) * 100

  return decrease.toFixed()
}
