import SparkEffect from "./spark";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import pointer from '../assets/pointer.svg';


function signin() {
 
  async function handleClick(){
    window.location.href = 'http://localhost:5000/auth/twitter'; 
  };

  return (
    <>
    <SparkEffect />
    <div className='flex flex-col justify-center items-center'>
     <DotLottieReact
      className='w-64 h-64 absolute top-16'
      src="https://lottie.host/499db928-c881-489d-9cc5-53950e666e37/V9NoP2tl3a.lottie" 
      loop
      autoplay
     />
    <h1 className='text-3xl md:text-5xl font-bold p-2 md:p-4 mt-64'>See how far your tweets have come.</h1>
    <h2 className='text-xl md:text-3xl font-bold'>Sign up to know  <img src={pointer} alt="down pointer" className=' inline w-12 h-12 rotate-180 text-white' /></h2>
    <button onClick={handleClick}
     className="bg-white/10 backdrop-blur-md border border-white/40 p-2 px-4 mt-2 text-[#3e7dcb] rounded-xl shadow-2xl font-bold text-lg md:text-2xl transition duration-200 hover:bg-white/20">Let's go !</button>
    </div>
    </>
  )
}

export default signin;