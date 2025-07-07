import './App.css'
import Signin from './components/signin';
import Success from './components/success';
import { BrowserRouter as Router, Route, Routes} from 'react-router-dom';


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signin />} />
        <Route path="/auth/success" element={<Success />} />
      </Routes>
    </Router>
  );
}

