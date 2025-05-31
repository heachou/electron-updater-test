interface IUserScoreInfo {
  user: UserInfo
  scoreStat: {
    asOfYesterdayScore: number
    todayAddScore: number
    totalScore: number
  }
}
