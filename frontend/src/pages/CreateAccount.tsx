import CreateLoginInput from '../components/CreateLoginInput/CreateLoginInput'
import HeaderTop from '../components/headerTop/headerTop'
import BackgroundLoop from '../assets/backgrounds/202508212358.mp4'

const CreateAccount = () => {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <video autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "fill",
          zIndex: -1,
        }}
      >
        <source src={BackgroundLoop} type="video/mp4" />
      </video>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: -1,
        }}
      />
      <HeaderTop></HeaderTop>
      <CreateLoginInput ></CreateLoginInput>
    </div>
  )
}

export default CreateAccount