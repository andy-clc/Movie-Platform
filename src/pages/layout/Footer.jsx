import React, { useState, useEffect } from 'react';
import '../../css/material-kit.css';
import Cookies from 'js-cookie';



export default function Footer() {

    const [version, setVersion] = useState('');
    const [expireTime, setExpireTime] = useState('');

    // Function to check the cookie version
    const checkForUpdate = () => {
        const cookieData = Cookies.get('version');
        if (cookieData) {
            const { value } = JSON.parse(cookieData);
            return value;
        }
        return null;
    };

    // Function to show the expire time of the cookie
    const showExpireTime = () => {
        const cookieData = Cookies.get('version');
        if (cookieData) {
            const { expires } = JSON.parse(cookieData);
            const now = new Date().getTime();
            const timeRemaining = expires - now;

            if (timeRemaining > 0) {
                const secondsRemaining = Math.floor(timeRemaining / 1000);
                const minutesRemaining = Math.floor(secondsRemaining / 60);
                const hoursRemaining = Math.floor(minutesRemaining / 60);
                const daysRemaining = Math.floor(hoursRemaining / 24);
                return `${daysRemaining} D ${hoursRemaining % 24} H ${minutesRemaining % 60} M ${secondsRemaining % 60} S.`;
            } else {
                return 'The cookie has expired.';
            }
        }
        return 'Cookie "version" does not exist.';
    };

    // Function to update version and expire time
    const updateCookieInfo = () => {
        const newVersion = checkForUpdate();
        const newExpireTime = showExpireTime();
        setVersion(newVersion || 'No version found');
        setExpireTime(newExpireTime);
    };

    useEffect(() => {
        // Initial check for cookies
        updateCookieInfo();

        // Set interval to update cookie info every 5 seconds
        const interval = setInterval(() => {
            updateCookieInfo();
        }, 5000); // Check every 5 seconds

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, []);
    return (
        <div>
            <footer className="site-footer">
                <div className="container">
                    <div className="inner light">
                        <div className="row text-center">
                            <div className="col-md-8 mb-3 mb-md-0 mx-auto">
                                <p style={{ textShadow: '0 1px 1px BLACK', fontWeight: '1000' }}>
                                    版本{version} - {expireTime} &mdash; Copyright &copy; {new Date().getFullYear()} 版權所有 &mdash; All Rights Reserved by Andy-CLC.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
