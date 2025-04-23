import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
//import "../node_modules/bootstrap/dist/css/bootstrap.min.css";//Bootstrap CDN
//import 'bootstrap/dist/js/bootstrap.bundle.min.js';//Bootstrap CDN
//import './css/main.css';

import Navbar from './pages/layout/Navbar';
import Footer from './pages/layout/Footer';
import NotFound from './pages/layout/404';

import Home from './pages/sub_page/Home'
import Video from './pages/sub_page/Video'

function App() {
  return (
    <div className="App">

      <Router basename="/Movie-Platform">
        {/* <Navbar /> */}
        <Routes>

          <Route exact path="/" element={<Video />} />
          <Route exact path="/home" element={<Home />} />

          {/* 404 Not Found*/}
          <Route path='/404' element={<NotFound />} />
          <Route path='*' element={<Navigate replace to='/404' />} />
        </Routes>
        <Footer />
      </Router>

    </div>
  );
}

export default App;
