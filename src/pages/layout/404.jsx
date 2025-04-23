import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFound() {
    const navigate = useNavigate();
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
    };

    const headingStyle = {
        fontSize: '4rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
    };

    const textStyle = {
        fontSize: '1.5rem',
        marginBottom: '2rem',
    };

    const redirect = () => {
        navigate(`/`);
    }

    return (
        <div style={containerStyle}>
            <h1 style={headingStyle}>404</h1>
            <p style={textStyle}>哎呀！您要尋找的頁面不存在。</p>
            <button className="btn btn-danger" onClick={redirect}>返回首頁</button>
        </div>
    );
}

export default NotFound;