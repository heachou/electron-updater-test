import dayjs from 'dayjs'
const Copyright = () => {
  const year = dayjs().year()
  return (
    <div className="flex items-center justify-center text-sm">
      <div>
        <span>Copyright © {year}</span>
        <span>All rights reserved.</span>
      </div>
      <div>
        <span>ICP备案号：</span>
        <span>京ICP备2021009861号-1</span>
      </div>
    </div>
  )
}

export default Copyright
