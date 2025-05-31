interface IFaceCheckReq {
  arrayBuffer: ArrayBuffer
  filename: string
  contentType: string
}

interface IScanQrCodeUserInfoRes {
  expire: number
  user: UserInfo
  status: number
}

interface UserInfo {
  createBy: string | null
  createTime: string // 或者 Date 类型，取决于你如何处理
  updateBy: string | null
  updateTime: string // 或者 Date 类型
  remark: string | null
  id: number
  openid: string
  name: string
  avatar: string
  phoneNumber: string
  cardNo: string
  gender: string | null // 根据实际情况可能需要更具体的类型，如 'male' | 'female' | null
  birth: string | null // 或者 Date 类型
  unionId: string | null
  homeId: number
  score: number
  token: string
  faces: string[]
  realName: string
  contactNumber: string
  residentialCommunity: string
  building: string
  cell: string
  number: string
}
