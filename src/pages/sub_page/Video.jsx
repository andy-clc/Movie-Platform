
import React, { useState, useEffect, useMemo, useRef } from 'react';
import movieData from '../videos.json';
import blockData from '../block.json';
import ytData from '../yt.json';
import '../../css/material-kit.css';
import '../../css/video.css';
import { Button, Modal, Dropdown, Form, Carousel, Card, Accordion } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import $ from 'jquery';
import AOS from 'aos';
import 'aos/dist/aos.css'; // Import AOS styles
//import Popper from 'popper.js';
import Not_found from '../../img/default_img.png'
import { disableInteractions } from '../../js/disable';
import { ToastContainer, toast } from 'react-toastify';
/* import 'flag-icon-css/css/flag-icons.min.css'; */
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import Marquee from "react-fast-marquee";
import { Fullscreen, FiberManualRecord, NewReleases, ReportGmailerrorred, NotificationImportant, DownloadForOffline, FiberNew } from '@mui/icons-material';//Icon

import { getDatabase, ref, set, push, get, remove } from "firebase/database";
import app from "../../firebaseconfig"
import { UAParser } from 'ua-parser-js';

import YouTube from 'react-youtube';

export default function Video() {
    const [visibleMovies, setVisibleMovies] = useState(12);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().getTime());
    const [modalShow, setModalShow] = useState(false);
    const [modalTitle, setModalTitle] = useState(null);
    const [modalBody, setModalBody] = useState(null);
    const [isModalFullscreen, setModalFullscreen] = useState(false);
    //const [downloadStart, setdownloadStart] = useState(new Date("2024-09-01 00:00:00").getTime());
    //const [downloadEnd, setdownloadEnd] = useState(new Date("2024-09-20 00:00:00").getTime());
    const [isPlaying, setIsPlaying] = useState(true);
    const [viewRecords, setViewRecords] = useState([]);

    const [ytDataMap, setytDataMap] = useState({});
    const [TVSeriesDataMap, setTVSeriesDataMap] = useState({});
    const [viewYTRecords, setviewYTRecords] = useState(null);
    const [viewTVRecords, setviewTVRecords] = useState(null);
    //const [updateYT, setupdateYT] = useState(false);
    const db = getDatabase(app);

    const futureMoviesByMonth = useMemo(() => {
        const combinedData = [...movieData, ...ytData];
        return combinedData.reduce((result, movie) => {
            const movieDate = new Date(movie.openDate);
            if (movieDate > new Date()) {
                const monthYear = `${format(movieDate, 'yyyy年MM月', { locale: zhTW })}`;
                if (!result[monthYear]) {
                    result[monthYear] = [];
                }
                result[monthYear].push(movie);
            }
            return result;
        }, {});
    }, [movieData]);

    useEffect(() => {
        // Fetch video data for each movie
        ytData.forEach(movie => {
            $.getJSON('https://noembed.com/embed', {
                format: 'json',
                url: movie.ytLink
            }, function (data) {
                setytDataMap(prevState => ({
                    ...prevState,
                    [movie.ytid]: data // Store video data by video ID
                }));
            });
        });

        // Fetch video data for each movie
        movieData.forEach(movie => {
            if (movie.isyt) {
                $.getJSON('https://noembed.com/embed', {
                    format: 'json',
                    url: movie.linkTemplate
                }, function (data) {

                    const newThumbnail = data.thumbnail_url || movie.image; // Fallback to original image
                    /* setMovies(prevMovies =>
                        prevMovies.map(m =>
                            m.ytid === movie.ytid ? { ...m, image: newThumbnail } : m
                        )
                    ); */

                    setTVSeriesDataMap(prevState => ({
                        ...prevState,
                        [movie.title]: data.thumbnail_url // Store video data by video ID
                    }));
                });
            }
        });
    }, [ytData, movieData]);

    const checkForUpdate = async () => {
        try {
            const response = await fetch(`${process.env.PUBLIC_URL}/version.json`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const cookiesVersion = Cookies.get('version');
            const daysToExpire = 365;
            const expirationDate = new Date();
            expirationDate.setTime(expirationDate.getTime() + (daysToExpire * 24 * 60 * 60 * 1000));
            if (!cookiesVersion) {

                Cookies.set('version', JSON.stringify({
                    value: data.version,
                    expires: expirationDate.getTime() // Store expiration time in milliseconds
                }));
                return
            }
            const cookiesVersions = Cookies.get('version');
            const { value, expires } = JSON.parse(cookiesVersions);
            if (data.version !== value) {
                var message =
                    <div>
                        頁面有新版本更新，將於2秒後刷新獲取
                    </div>
                toast.info(message, {
                    autoClose: 1500,
                    onClose: () => {
                        window.location.reload(); // Refresh the page
                        Cookies.set('version', JSON.stringify({
                            value: data.version,
                            expires: expirationDate.getTime() // Store expiration time in milliseconds
                        }));
                    },
                });
            }
        } catch (error) {
            var message =
                <div>
                    錯誤:{error}
                </div>
            toast.error(message, {
                autoClose: 1500
            });
        }
    };

    useEffect(() => {/* Load when page loaded */
        disableInteractions();
        checkForUpdate()
        getAllViewRecords()
        AOS.init({
            duration: 1500, // Animation duration in milliseconds
            once: false, // Whether animation should happen only once
        });
        /* const interval = setInterval(() => {
            setCurrentTime(new Date().getTime());
        }, 5000);
        return () => clearInterval(interval); */
    }, []);

    useEffect(() => {
        setCurrentTime(new Date().getTime());
    }, [viewRecords]);

    let openedWindow = null; // Declare outside of useEffect

    useEffect(() => {/* 即將跳轉頁面 */
        let is_clicked = false;
        $(document).on("click touchend", ".movie_list_item", function (event) {
            const childHref = event.target.getAttribute('data-href');
            const childTitle = event.target.getAttribute('data-movie');
            const childEP = event.target.getAttribute('data-ep');
            const movie = findMovieByKey("title", childTitle, movieData);
            if (movie && !is_clicked) {
                var get_cookies = Cookies.get('recent_movies')
                if (get_cookies) {
                    var new_cookies = get_cookies + ',' + movie.title;
                    Cookies.set('recent_movies', new_cookies)
                }
                is_clicked = true;
                document.querySelector('html').style.pointerEvents = 'none';
                /* ************************************************************************ */
                let parser = new UAParser();
                let parserResults = parser.getResult();
                let curr_time = formatRecordDate(new Date())
                const newDocRef = push(ref(db, `video/${formatOpenDate(new Date())}/click_ep/${curr_time}`))
                set(newDocRef, {
                    click_video_Name: `用户點擊劇集 【${movie.title}】${event.target.text}`,
                    movie_name: movie.title,
                    ep: Number(childEP),
                    browser: parserResults.browser,
                    os: parserResults.os,
                    user: parserResults.ua,
                    time: curr_time
                }).then(() => {
                }).catch((error) => {
                    toast.error("上傳數據失敗" + error, {
                        autoClose: 500
                    });
                })
                /* **************************************************************************** */
                if (!movie.isyt || movie.isyt == undefined) {
                    var message =
                        <div>
                            即將跳轉頁面 <br />劇集：{movie.title} {event.target.text}
                        </div>
                    toast.info(message, {
                        autoClose: 1500,
                        onClose: () => {
                            setModalShow(false);
                            is_clicked = false
                            document.querySelector('html').style.pointerEvents = 'all'
                            var isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
                                navigator.userAgent &&
                                navigator.userAgent.indexOf('CriOS') === -1 &&
                                navigator.userAgent.indexOf('FxiOS') === -1;
                            if (isSafari === true) {
                                if (openedWindow && !openedWindow.closed) {
                                    openedWindow.focus();
                                    openedWindow.location.href = childHref;
                                } else {
                                    openedWindow = window.open(childHref, "_self");
                                }
                            } else {
                                if (openedWindow && !openedWindow.closed) {
                                    openedWindow.focus();
                                    openedWindow.location.href = childHref;
                                } else {
                                    openedWindow = window.open(childHref, '_blank');
                                }
                            }
                        },
                    });
                } else if (movie.isyt) {
                    setModalTitle(`${movie.title} 【 ${event.target.text} 】`);
                    const combinedTitle = `${movie.title}-${event.target.text}`;
                    setModalFullscreen(true)
                    setModalBody(
                        <div className="d-flex flex-wrap justify-content-center m-3">
                            <YouTubePlayer videoId={childHref} title={combinedTitle} />
                        </div>
                    );
                    /* const dataRef = ref(db, `yt_data/${combinedTitle}`);
                    const snapshot =  get(dataRef);
                    if (snapshot.exists()) {
                        const currentTime = snapshot.val().currentTime; // Access currentTime
                        let totalDuration = snapshot.val().total_sec;
                        console.log(totalDuration - currentTime)
                    } */
                    var message =
                        <div>
                            即將播放 <br />劇集：{movie.title} {event.target.text}
                        </div>
                    toast.info(message, {
                        autoClose: 1000,
                        onClose: () => {
                            is_clicked = false;
                            document.querySelector('html').style.pointerEvents = 'all'
                            setModalFullscreen(true)
                            setModalBody(
                                <div className="d-flex flex-wrap justify-content-center m-3">
                                    <YouTubePlayer videoId={childHref} title={combinedTitle} />
                                </div>
                            );
                        },
                    });
                }
            } else {
            }
        });

        function closeAllOpenedWindows() {
            try {
                if (openedWindow && !openedWindow.closed) {
                    openedWindow.close();
                }
            } catch (e) {
                console.error("Failed to close the window: ", e);
            }
            /* let openedWindows = [];

            // Find all opened windows
            for (let i = 0; i < window.length; i++) {
                const win = window[i];
                if (win && win.open && !win.closed && win !== window.self) {
                    openedWindows.push(win);
                }
            }

            // Close each opened window
            openedWindows.forEach((win) => {
                win.close();
            }); */
        }

        var count = 0
        document.onvisibilitychange = function () {
            switch (document.visibilityState) {
                case 'hidden':
                    count = count + 1
                    setIsPlaying(false);
                    // 使用者不在頁面上時要做的事……
                    break;
                case 'visible':
                    closeAllOpenedWindows();
                    setIsPlaying(true);
                    checkForUpdate()
                    setCurrentTime(new Date().getTime());
                    try {
                        if (openedWindow && !openedWindow.closed) {
                            openedWindow.focus();
                            openedWindow.close();
                        }
                    } catch (e) {
                        console.error("Failed to close the window: ", e);
                    }
                    if (count >= 3) {
                        count = 0
                        //window.location.reload();
                    }
                    //window.location.reload();
                    //location.reload();
                    break;
            }
        };

    }, []);

    const handleScroll = () => {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop;
        const clientHeight = document.documentElement.clientHeight;

        const movie_totla = movieData.filter((movie) => {
            const currentTime = new Date().getTime();
            const openDate = new Date(movie.openDate).getTime();
            const expiredDate = new Date(movie.expiredDate).getTime();

            return currentTime >= openDate && currentTime <= expiredDate;
        })

        if (!isLoading && scrollTop + clientHeight >= scrollHeight && visibleMovies < movie_totla.length) {
            setIsLoading(true);
            setTimeout(() => {
                setVisibleMovies(visibleMovies + 6);
                setIsLoading(false);
            }, 500); // Simulate loading time
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [visibleMovies, handleScroll]);

    const findMovieByKey = (key, title, movieData) => {
        return movieData.find((movie) => movie[key] === title);
    };

    const findBlockByKey = () => {
        const currentDate = new Date(currentTime); // Ensure currentTime is correctly set
        const activeBlock = blockNote.find((block) => {
            const start = new Date(block.startTime);
            const end = new Date(block.endTime);

            return currentDate >= start && currentDate <= end; // Check if current time is within the range
        });
        return activeBlock; // This will return the active block or undefined if none found
    };

    const [blockNote, setBlockNote] = useState([]);
    useEffect(() => {//Get Block Datas
        const fetchBlockNote = async () => {
            const dbRef = ref(db, "block");
            let firebaseData = [];

            try {
                const snapshot = await get(dbRef);
                if (snapshot.exists()) {
                    const rawData = snapshot.val();

                    // Normalize Firebase data
                    firebaseData = Object.values(rawData).map(item => ({
                        startTime: item.startTime,
                        endTime: item.endTime,
                        reason: item.reason,
                    }));
                } else {
                    console.log("No data available in Firebase.");
                }
            } catch (error) {
                console.error("Error fetching data from Firebase:", error);
            }

            // Combine Firebase data with local blockData
            const combinedData = [...blockData, ...firebaseData];
            // Find the block note
            const currentDate = new Date(currentTime);
            const foundBlockNote = combinedData.filter((block) => {
                const end = new Date(block.endTime);
                return currentDate <= end;
            });

            setBlockNote(foundBlockNote);
        };

        fetchBlockNote();
    }, [db]);

    const getDailyEpValues = async (db, movieTitle) => {
        const dbRef = ref(db, "video");
        const snapshot = await get(dbRef);
        const dailyEpValues = [];

        if (snapshot.exists()) {
            const video_arr = snapshot.val();

            // Iterate through each date in the video_arr
            for (const date of Object.keys(video_arr)) { // Date: 2024-10-16
                const dates = video_arr[date];
                for (const eventtype in dates) { // event type: click_block_event/click_ep
                    if (eventtype === 'click_ep') {
                        for (const innerIndex in dates[eventtype]) {
                            for (const innerIndex2 in dates[eventtype][innerIndex]) {
                                if (dates[eventtype][innerIndex][innerIndex2].movie_name === movieTitle) {
                                    dailyEpValues.push(dates[eventtype][innerIndex][innerIndex2]);
                                }
                            }
                        }
                    }
                }
            }
        }
        return dailyEpValues; // Return the populated array
    }

    const getExistEpValues = (movieTitle) => {
        let dailyEpValues = 0;

        // Iterate through each date in the video_arr
        for (const record of viewRecords) {
            if (record.movie_name === movieTitle) {
                dailyEpValues++;
            }
        }

        return dailyEpValues; // Return the populated array
    }

    const getOldDates = (existDate) => {
        const fortyFiveDaysAgo = new Date();
        fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45); // Subtract 45 days from the current date

        // Filter the existDate array
        const oldDates = existDate.filter(date => {
            const currentDate = new Date(date); // Convert string to Date object
            return currentDate < fortyFiveDaysAgo; // Check if the date is older than one month ago
        });

        return oldDates;
    };

    const deleteRecord = async (recordId) => {
        const recordRef = ref(db, `video/${recordId}`); // Change the path as necessary

        try {
            await remove(recordRef);
            toast.success(`ID為 ${recordId} 的記錄已成功刪除。`, {
                autoClose: 1000
            });
        } catch (error) {
            toast.error(`刪除記錄時發生錯誤：", ${error}`, {
                autoClose: 1500
            });
        }
    };

    const getAllViewRecords = async () => {//Get all view records before page loaded, trigger once only, or it may consume DB memory
        const db = getDatabase(app);
        const dbRef = ref(db, "video");
        const snapshot = await get(dbRef);
        const allViewRecords = [];
        const existDate = [];

        if (snapshot.exists()) {
            const video_arr = snapshot.val();

            // Iterate through each date in the video_arr
            for (const date of Object.keys(video_arr)) {
                const dates = video_arr[date];
                existDate.push(date)
                for (const eventtype in dates) {
                    if (eventtype === 'click_block_event' || eventtype === 'click_ep') {
                        for (const innerIndex in dates[eventtype]) {
                            for (const innerIndex2 in dates[eventtype][innerIndex]) {
                                allViewRecords.push(dates[eventtype][innerIndex][innerIndex2]);
                            }
                        }
                    }
                }
            }
        }
        const oldDates = getOldDates(existDate);
        oldDates.forEach(oldDate => {
            deleteRecord(oldDate)
        });
        setViewRecords(allViewRecords);
    }

    const API_KEY = process.env.REACT_APP_YT_API_KEY; // Replace with your YouTube Data API key
    const getPlaylistVideos = async (playlistId, MAX_RESULTS) => {
        const fetchedLinks = [];
        let nextPageToken = '';

        try {
            do {
                const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${MAX_RESULTS}&pageToken=${nextPageToken}&key=${API_KEY}`);
                const data = await response.json();

                if (data.items) {
                    data.items.forEach(item => {
                        const videoId = item.snippet.resourceId.videoId;
                        fetchedLinks.push(videoId);
                    });
                }

                nextPageToken = data.nextPageToken; // Get the next page token for pagination
            } while (nextPageToken && fetchedLinks.length < MAX_RESULTS); // Continue until we get enough links

            return fetchedLinks;
        } catch (error) {
            console.error('Error fetching playlist videos:', error);
            return [];
        }
    };

    const handleMovieBlockClick = async (title) => {/* Handle the block click */
        let parser = new UAParser();
        let parserResults = parser.getResult();
        const movie = findMovieByKey("title", title, movieData);
        const viewno = getExistEpValues(movie.title);
        const expiredDate = new Date(new Date(movie.expiredDate).getTime() - (viewno * 1000 * 60 * 60 * 2));
        if (movie) {
            if (expiredDate < currentTime) {
                const db = getDatabase(app);
                let curr_time = formatRecordDate(new Date())
                const newDocRef = push(ref(db, `video/${formatOpenDate(new Date())}/click_block_event/${curr_time}`))
                set(newDocRef, {
                    click_video_Name: `用户點擊已過期劇集 【${movie.title}】`,
                    browser: parserResults.browser,
                    os: parserResults.os,
                    user: parserResults.ua,
                    time: curr_time
                }).then(() => {
                    toast.success("上傳數據成功", {
                        autoClose: 500
                    });
                }).catch((error) => {
                    toast.error("上傳數據失敗: " + error, {
                        autoClose: 500
                    });
                })

                var message =
                    <div>
                        劇集 【{movie.title}】已過期
                    </div>
                toast.error(message, {
                    autoClose: 1500
                });
                return
            }

            if (new Date(movie.openDate).getTime() > currentTime) {
                const db = getDatabase(app);
                let curr_time = formatRecordDate(new Date())
                const newDocRef = push(ref(db, `video/${formatOpenDate(new Date())}/click_block_event/${curr_time}`))
                set(newDocRef, {
                    click_video_Name: `用户點擊未開播劇集 【${movie.title}】`,
                    browser: parserResults.browser,
                    os: parserResults.os,
                    user: parserResults.ua,
                    time: curr_time
                }).then(() => {
                    toast.success("上傳數據成功", {
                        autoClose: 500
                    });
                }).catch((error) => {
                    toast.error("上傳數據失敗: " + error, {
                        autoClose: 500
                    });
                })

                let message =
                    <div>
                        劇集 【{movie.title}】尚未開播
                    </div>
                toast.error(message, {
                    autoClose: 1500
                });
                return
            }
            const currentBlockData = findBlockByKey();
            if (currentBlockData) {
                const db = getDatabase(app);
                let curr_time = formatRecordDate(new Date())
                const newDocRef = push(ref(db, `video/${formatOpenDate(new Date())}/click_block_event/${curr_time}`))
                set(newDocRef, {
                    click_video_Name: `用户點擊暫時停用劇集 【${movie.title}】`,
                    browser: parserResults.browser,
                    os: parserResults.os,
                    user: parserResults.ua,
                    time: curr_time
                }).then(() => {
                    toast.success("上傳數據成功", {
                        autoClose: 500
                    });
                }).catch((error) => {
                    toast.error("上傳數據失敗: " + error, {
                        autoClose: 500
                    });
                })

                let message =
                    <div>
                        {currentBlockData.reason}，播映功能暫時停用<br /><br />
                        服務將於[{currentBlockData.endTime}]後恢復
                    </div>
                toast.info(message, {
                    autoClose: 5000
                });
                return
            }
            /* *********************************** */
            const db = getDatabase(app);
            const dailyEpValues = await getDailyEpValues(db, movie.title);
            if (!movie.notAll) {
                setModalTitle(`${movie.title} 【 全${movie.episodes} 集】`);
            } else {
                setModalTitle(`${movie.title} 【 更新至 ${movie.episodes} 集】`);
            }
            let videoLinks = []; // Temporary variable to hold video links
            if (movie.isyt) {
                const MAX_RESULTS = movie.episode < 50 ? movie.episode : 50; // Maximum number of results to fetch
                videoLinks = await getPlaylistVideos(movie.playlist_id, MAX_RESULTS); // Await here
            }
            const currentMonth = new Date().getMonth() + 1;
            // Create the episode buttons as JSX
            const episodeButtons = Array.from({ length: movie.episodes }, (_, i) => {
                const episodeNumber = i + 1; // i starts from 0
                const found = dailyEpValues.some(record => Number(record.ep) === episodeNumber);
                const additionalClass = !found && currentMonth === 12 ? 'christmas_button' : '';
                // Determine the episode link based on whether movie.isyt is true
                let episodeLink;
                if (!movie.isyt || movie.isyt === undefined) {
                    episodeLink = movie.linkTemplate.replace('?EP?', episodeNumber.toString());
                } else {
                    episodeLink = videoLinks ? videoLinks[episodeNumber - 1] : ''; // Fallback if newYtLink is not yet available
                }
                return (
                    <div className="movie_list_item" key={episodeNumber}>
                        <a
                            data-movie={movie.title}
                            data-ep={episodeNumber}
                            data-href={episodeLink}
                            target="_blank"
                            className={`custom-btn btn-11 ${found ? '' : 'not-found'} ${additionalClass}`}
                            style={{
                                boxShadow: 'unset',
                                background: found ? 'linear-gradient(180deg, #535353, rgb(183, 183, 183))' : 'linear-gradient(180deg,#3f51b5,#ecefff)',
                                margin: '10px',
                                border: '1px dotted #3F51B5',
                                color: 'white'
                            }}
                        >
                            第{episodeNumber}集<div className="dot"></div>
                        </a>
                    </div>
                );
            });

            // Set the modal body
            setModalBody(
                <>
                    <div className="d-flex flex-wrap justify-content-center m-3">
                        {episodeButtons}
                    </div>
                    <p className="m-0 text-center">收看次數: {dailyEpValues.length}</p>
                </>
            );
            setModalShow(true);
            setModalFullscreen(false)
        } else {
            var error_msg =
                <div>
                    未找到標題為 {title} 的劇集，請重試
                </div>
            toast.error(error_msg, {
                autoClose: 1500
            });
        }
    };

    const formatRecordDate = (openDateString) => {
        const openDate = new Date(openDateString);
        const year = openDate.getFullYear();
        const month = String(openDate.getMonth() + 1).padStart(2, '0');
        const date = String(openDate.getDate()).padStart(2, '0');
        const hours = String(openDate.getHours()).padStart(2, '0');
        const minutes = String(openDate.getMinutes()).padStart(2, '0');
        const seconds = String(openDate.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
    };

    const formatOpenDate = (openDateString) => {
        const openDate = new Date(openDateString);
        return `${openDate.getFullYear()}-${String(openDate.getMonth() + 1).padStart(2, '0')}-${String(openDate.getDate()).padStart(2, '0')}`;
    };

    const YouTubePlayer = ({ videoId, title }) => {
        const [movieState, setmovieState] = useState(1);
        const playerRef = useRef(null);
        const iframeRef = useRef(null);
        const intervalRef = useRef(null);
        const [currentTime, setCurrentTime] = useState(0);
        const [duration, setDuration] = useState(0);
        const db = getDatabase(app);

        const options = {
            height: '100%', // Set height to 100%
            width: '100%',  // Set width to 100%
            playerVars: {
                autoplay: 0,
                controls: 0, // Disable default controls to use custom ones
                cc: 0, // Enable closed captions
                rel: 0,
            },
        };
        const onPlayerReady = async (event) => {
            event.target.setOption('cc', 0); // Disable closed captions
            let lastTime = parseFloat(localStorage.getItem(`youtube_${videoId}_time`)) || 0;
            if (lastTime == 0) {
                const dataRef = ref(db, `yt_data/${title}`);
                const snapshot = await get(dataRef);
                if (snapshot.exists()) {
                    //const childKey = Object.keys(snapshot.val()); // Get the first (and only) child key
                    const currentTime = snapshot.val().currentTime; // Access currentTime
                    lastTime = Number(currentTime - 20);
                    console.log('Use Database to retreive time')
                } else {
                    lastTime = 105
                }
            } else {
                console.log('Use Local Storage to retrieve time')
            }
            event.target.seekTo(lastTime, true);
            setDuration(event.target.getDuration()); // Get total video duration
            intervalRef.current = setInterval(() => {
                const currentTime = Math.round(event.target.getCurrentTime());
                setCurrentTime(currentTime);
                localStorage.setItem(`youtube_${videoId}_time`, currentTime);
                if (currentTime % 60 === 0 && currentTime != 0) {
                    uploadVideoData(currentTime, title, videoId, Math.floor(event.target.getDuration()));
                }
            }, 500);
            iframeRef.current = event.target.getIframe(); // Store iframe reference
            var message =
                <div>
                    當前電影將於{Math.floor(lastTime / 60)}分 {lastTime % 60} 秒開始並全螢幕播放<br /><br />按下暫停按鈕將自動退出全螢幕模式
                </div>
            toast.info(message, {
                autoClose: 1500,
                onClose: () => {
                    if (iframeRef.current) {
                        if (iframeRef.current.webkitExitFullscreen) {
                            iframeRef.current.requestFullscreen();
                        } else if (iframeRef.current.mozRequestFullScreen) {
                            iframeRef.current.mozRequestFullScreen();
                        } else if (iframeRef.current.webkitRequestFullscreen) {
                            iframeRef.current.webkitRequestFullscreen();
                        } else if (iframeRef.current.msRequestFullscreen) {
                            iframeRef.current.msRequestFullscreen();
                        }
                    }
                },
            });

        };

        const uploadVideoData = async (currentTime, title, videoId, total_sec) => {
            const curr_time = formatRecordDate(new Date());
            const dataRef = ref(db, `yt_data/${title}`);
            try {
                const snapshot = await get(dataRef);
                let existingData;

                if (snapshot.exists()) {
                    existingData = snapshot.val();
                    // Check if the currentTime in existing data is greater than the new currentTime
                    if (existingData.currentTime > currentTime) {
                        toast.info("現有數據的 currentTime 大於新數據，數據未更新。", { autoClose: 500 });
                        return;
                    }
                    // Update existing data
                    await set(dataRef, {
                        currentTime,
                        videoId,
                        total_sec,
                        createdAt: curr_time
                    });
                    toast.success("數據已更新", { autoClose: 500 });
                } else {
                    // If no existing data, create a new entry
                    await set(dataRef, {
                        currentTime,
                        videoId,
                        total_sec,
                        createdAt: curr_time
                    });
                    toast.success("上傳數據成功", { autoClose: 500 });
                }
            } catch (error) {
                toast.error(`操作失敗: ${error.message}`, { autoClose: 5000 });
            }
        };

        const onPlayerStateChange = (event) => {
            setmovieState(event.data)
            if (event.data === 2) {//pause
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(err => {
                        console.error(`Error attempting to exit full-screen mode: ${err.message}`);
                    });
                }
            }
        };
        const togglePause = () => {
            const player = playerRef.current.internalPlayer;
            if (movieState == 1) {
                setmovieState(2)
                player.pauseVideo(); // Pause the video if it's playing
            } else {
                setmovieState(1)
                player.playVideo(); // Play the video if it's paused
                if (iframeRef.current) {
                    if (iframeRef.current.webkitExitFullscreen) {
                        iframeRef.current.requestFullscreen();
                    } else if (iframeRef.current.mozRequestFullScreen) {
                        iframeRef.current.mozRequestFullScreen();
                    } else if (iframeRef.current.webkitRequestFullscreen) {
                        iframeRef.current.webkitRequestFullscreen();
                    } else if (iframeRef.current.msRequestFullscreen) {
                        iframeRef.current.msRequestFullscreen();
                    }
                }
            }
        };
        useEffect(() => {
            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                if (playerRef.current) {
                    playerRef.current.destroy();
                    localStorage.removeItem(`youtube_${videoId}_time`);
                }
            };
        }, [videoId]);
        return (
            <div style={{ position: 'relative', width: '100%', height: '70vh' }}>
                <div style={{ position: 'absolute', right: '50%', transform: 'translate(50%)', width: '100%', height: '100%' }}>
                    <button
                        onClick={togglePause}
                        className={`play_button ${movieState === 2 ? '' : 'button--pause'}`}
                    >
                        <div className="button__icon play_icon">
                            <span className="icon__arrow"></span>
                            <span className="icon__line"></span>
                        </div>
                        <div className="button__text text">
                            <span className="text__play">播放</span>
                            <span className="text__pause">暫停</span>
                        </div><br />
                        <p className='video_time_show'>{currentTime} 秒 /{duration ? Math.round(duration) : 0} 秒 ({currentTime % 60})</p>
                    </button>

                </div>
                <YouTube
                    videoId={videoId}
                    opts={options}
                    onReady={onPlayerReady}
                    onStateChange={onPlayerStateChange}
                    //onError={func}   
                    ref={playerRef}
                    style={{ height: '100%' }}
                />
            </div>
        );
    };

    const handleYTBlockClick = async (title) => {/* Handle the block click */
        const movie = findMovieByKey("title", title, ytData);
        const viewno = getExistEpValues(movie.title);
        const expiredDate = new Date(new Date(movie.expiredDate).getTime() - (viewno * 1000 * 60 * 60 * 2));
        if (movie) {
            if (new Date(movie.openDate).getTime() > currentTime) {
                let parser = new UAParser();
                let parserResults = parser.getResult();
                const db = getDatabase(app);
                let curr_time = formatRecordDate(new Date())
                const newDocRef = push(ref(db, `video/${formatOpenDate(new Date())}/click_block_event/${curr_time}`))
                set(newDocRef, {
                    click_video_Name: `用户點擊未開播電影 【${movie.title}】`,
                    browser: parserResults.browser,
                    os: parserResults.os,
                    user: parserResults.ua,
                    time: curr_time
                }).then(() => {
                    toast.success("上傳數據成功", {
                        autoClose: 500
                    });
                }).catch((error) => {
                    toast.error("上傳數據失敗: " + error, {
                        autoClose: 500
                    });
                })

                let message =
                    <div>
                        電影 【{movie.title}】尚未開播
                    </div>
                toast.error(message, {
                    autoClose: 1500
                });
                return
            }
            const currentBlockData = findBlockByKey();
            if (currentBlockData) {
                const db = getDatabase(app);
                let curr_time = formatRecordDate(new Date())
                const newDocRef = push(ref(db, `video/${formatOpenDate(new Date())}/click_block_event/${curr_time}`))
                set(newDocRef, {
                    click_video_Name: `用户點擊暫時停用電影 【${movie.title}】`,
                    browser: parserResults.browser,
                    os: parserResults.os,
                    user: parserResults.ua,
                    time: curr_time
                }).then(() => {
                    toast.success("上傳數據成功", {
                        autoClose: 500
                    });
                }).catch((error) => {
                    toast.error("上傳數據失敗: " + error, {
                        autoClose: 500
                    });
                })

                let message =
                    <div>
                        {currentBlockData.reason}，播映功能暫時停用<br /><br />
                        服務將於[{currentBlockData.endTime}]後恢復
                    </div>
                toast.info(message, {
                    autoClose: 5000
                });
                return
            }
            let parser = new UAParser();
            let parserResults = parser.getResult();
            let curr_time = formatRecordDate(new Date())
            const newDocRef = push(ref(db, `video/${formatOpenDate(new Date())}/click_ep/${curr_time}`))
            set(newDocRef, {
                click_video_Name: `用户點擊電影 【${movie.title}】`,
                movie_name: movie.title,
                browser: parserResults.browser,
                os: parserResults.os,
                user: parserResults.ua,
                time: curr_time
            }).then(() => {
            }).catch((error) => {
                toast.error("上傳數據失敗" + error, {
                    autoClose: 500
                });
            })
            /* *********************************** */

            setModalTitle(movie.notAll
                ? `${movie.title} 【 更新至 ${movie.episodes} 集】`
                : `${movie.title} 【 全${movie.episodes} 集】`
            );

            // Create the episode buttons
            setModalBody(
                <div className="d-flex flex-wrap justify-content-center m-3">
                    <YouTubePlayer videoId={movie.ytid} title={movie.title} />
                </div>
            );
            setModalShow(true);
            setModalFullscreen(true)
        } else {
            toast.error(`未找到標題為 ${title} 的電影，請重試`, { autoClose: 1500 });
        }
    };

    const getYTValues = async (movieTitle) => {
        const db = getDatabase(app);
        const dataRef = ref(db, `yt_data/${movieTitle}`);
        const snapshot = await get(dataRef);
        let childdata;
        if (snapshot.exists()) {
            childdata = snapshot.val(); // Access the data of that child
        }


        return childdata; // Return the populated array
    }

    useEffect(() => {
        const fetchYTData = async () => {
            const currentTime = Date.now();
            const filteredVideos = [];
            const today = new Date().getDate();
            //YT Data Restructure
            for (const movie of ytData) {
                const openDate = new Date(movie.openDate).getTime();
                let expiredDate = new Date(movie.expiredDate).getTime();

                const dbData = await getYTValues(movie.title); // Wait for the database data

                if (!dbData) {
                }

                const threeDaysInMs = 2 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
                if (dbData && dbData.total_sec - dbData.currentTime >= 1200) {//如果開始觀看，就沒有過期時間，直到看完整部電影
                    filteredVideos.push({ ...movie, dbData });
                } else
                    if (
                        (!dbData && currentTime >= openDate && currentTime <= expiredDate) ||
                        (!dbData && currentTime + threeDaysInMs >= openDate && currentTime <= openDate)
                    ) {
                        filteredVideos.push({ ...movie, dbData }); // Add dbData to the movie object
                    } else {
                        /* if (dbData && today >= 1 && today <= 5) {//僅刪除日期在 1 到 5 之間的記錄
                            const db = getDatabase(app);
                            const dataRef = ref(db, `yt_data/${movie.title}`);
                            const snapshot = await get(dataRef);
                            if (snapshot.exists()) {
                                try {
                                    await remove(dataRef);
                                    toast.success(`ID為 ${movie.title} 的記錄已成功刪除。`, {
                                        autoClose: 1000
                                    });
                                } catch (error) {
                                    toast.error(`刪除記錄時發生錯誤：", ${error}`, {
                                        autoClose: 1500
                                    });
                                }
                            }
                            
                        } */
                    }
            }
            setviewYTRecords(filteredVideos);

            const filteredTVVideos = [];
            for (const movie of movieData) {
                const openDate = new Date(movie.openDate).getTime();
                const viewno = await getExistEpValues(movie.title);
                let expiredDate = new Date(new Date(movie.expiredDate).getTime() - (viewno * 1000 * 60 * 60 * 2));
                if (viewRecords.length === 0) {
                    expiredDate = new Date("1990-01-01 00:00:00");
                }
                const threeDaysInMs = 2 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
                if (
                    (currentTime >= openDate && currentTime <= expiredDate) ||
                    (currentTime + threeDaysInMs >= openDate && currentTime <= openDate)
                ) {
                    filteredTVVideos.push({ ...movie, movie }); // Add dbData to the movie object
                } /* else {
                    if (today >= 1 && today <= 5) {
                        const db = getDatabase(app);
                        const dataRef = ref(db, `yt_data/`);
                        const snapshot = await get(dataRef);
                        const video_arr = snapshot.val();

                        // Iterate through each date in the video_arr
                        for (const name of Object.keys(video_arr)) { // Date: 2024-10-16
                            if (name.includes(movie.title)) {
                                const removeRef = ref(db, `yt_data/${name}`);
                                try {
                                    await remove(removeRef);
                                    console.log(`ID為 ${movie.title} 的記錄已成功刪除。`)
                                    toast.success(`ID為 ${movie.title} 的記錄已成功刪除。`, {
                                        autoClose: 1000
                                    });
                                } catch (error) {
                                    toast.error(`刪除記錄時發生錯誤：", ${error}`, {
                                        autoClose: 1500
                                    });
                                }
                            }
                        }
                    } 
                }*/
            }
            setviewTVRecords(filteredTVVideos);

        };

        fetchYTData();
    }, [ytData, viewRecords]);

    //Admin DropDown List Func.
    const handleAdminDropdownItemClick = async (action) => {
        const recordRef = ref(db, `admin_psw`); // Change the path as necessary
        const snapshot = await get(recordRef);
        let childdata;
        if (snapshot.exists()) {
            childdata = snapshot.val(); // Access the data of that child
        }
        if (!Cookies.get('admin_auth')) {
            const password = prompt('請輸入密碼:');
            if (password === childdata) { // Replace 'yourPassword' with the actual password
                Cookies.set('admin_auth', 'true', { expires: 365 });

                performAction(action);
            } else {
                alert('密碼錯誤，請再試一次。');
            }
        } else {
            performAction(action);
        }
    };

    const [AddformData, setAddFormData] = useState({
        type: "",
        title: "",
        language: "",
        startTime: "",
        endTime: "",
        link: "",
        episodes: "",
        playlistId: ""
    });

    const handleAddInputChange = (e) => {
        const { name, value } = e.target;
        console.log("Input Name:", name); // Log the name of the input
        
        setAddFormData({ [name]: value })
        /* setAddFormData((prevData) => ({
            ...prevData,
            [name]: value,
        })); */
        console.log("Current AddformData (old state):", AddformData);
    };

    useEffect(() => {
        console.log("Updated AddformData:", AddformData);
    }, [AddformData]);


    const handleSubmit = (e) => {
        e.preventDefault();
        //if (AddformData.type == "1"){
            /* const newDocRef = push(ref(db, `new_episode`))
            set(newDocRef, {
                AddformData
            }).then(() => {
                toast.success("上傳數據成功", {
                    autoClose: 500
                });
            }).catch((error) => {
                toast.error("上傳數據失敗: " + error, {
                    autoClose: 500
                });
            }) */
        //}
        console.log("Submitted AddformData:", AddformData);
        // You can handle form submission here (e.g., send to API)
    };

    const performAction = (action) => {


        // Get today's and tomorrow's date
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const tomorrowString = tomorrow.toISOString().split('T')[0] + 'T00:00'; // Format: YYYY-MM-DDTHH:MM

        switch (action) {
            case '新增':
                setModalShow(true)
                setModalTitle("將新電影或劇集加入資料庫")
                setModalBody(
                    <>
                        <div className="d-flex flex-wrap justify-content-center text-white">
                            <Form onSubmit={handleSubmit}>
                                <Form.Select name="type" aria-label="Default select example" onChange={handleAddInputChange}>
                                    <option>插入的是電影或劇集</option>
                                    <option value="1">電影</option>
                                    <option value="2">劇集</option>
                                </Form.Select>

                                <Form.Group className="mb-3 mt-3" controlId="formBasicTitle">
                                    <Form.Control
                                        type="text"
                                        name="title"
                                        placeholder="標題"
                                        onChange={handleAddInputChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formBasicLanguage">
                                    <Form.Control
                                        type="text"
                                        name="language"
                                        placeholder="Language"
                                        onChange={handleAddInputChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formBasicStartTime">
                                    <Form.Label>開放時間</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="startTime"
                                        placeholder="開放時間"
                                        min={todayString}
                                        defaultValue={tomorrowString}
                                        onChange={handleAddInputChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formBasicEndTime">
                                    <Form.Label>到期時間</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="endTime"
                                        placeholder="到期時間"
                                        min={todayString}
                                        defaultValue={tomorrowString}
                                        onChange={handleAddInputChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formBasicLink">
                                    <Form.Control
                                        type="text"
                                        name="link"
                                        placeholder="Link"
                                        onChange={handleAddInputChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formBasicEpisodes">
                                    <Form.Control
                                        type="text"
                                        name="episodes"
                                        placeholder="集數"
                                        onChange={handleAddInputChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formBasicPlaylistId">
                                    <Form.Control
                                        type="text"
                                        name="playlistId"
                                        placeholder="Playlist ID"
                                        onChange={handleAddInputChange}
                                    />
                                </Form.Group>

                                <Button variant="primary" type="submit">
                                    Submit
                                </Button>
                            </Form>
                        </div>
                    </>
                );
                console.log('Add action performed');
                break;
            case '編輯':
                console.log('Edit action performed');
                break;
            case '刪除':
                console.log('Delete action performed');
                break;
            default:
                break;
        }
    };
    //End Admin DropDown List Func.

    return (
        <div>
            <ToastContainer
                progressClassName="toastProgress"
                bodyClassName="toastBody"
            />
            <Modal
                fullscreen={isModalFullscreen} // Dynamically set fullscreen
                size="xl"
                aria-labelledby="contained-modal-title-vcenter"
                centered
                show={modalShow}
                onHide={() => setModalShow(false)}
                style={{
                    display: "grid",
                    placeItems: "center"
                }}
            >
                <div style={{ background: "#4f545c" }}>
                    <Modal.Header className="d-flex justify-content-center text-white">
                        <Modal.Title id="contained-modal-title-vcenter" className="font-weight-bolder">
                            {modalTitle}
                        </Modal.Title>
                        <button type="button" className="btn-close" aria-label="Close" onClick={() => setModalShow(false)}></button>
                    </Modal.Header>
                    <Modal.Body className="text-white" style={{
                        maxHeight: 'calc(100vh - 210px)',
                        overflowY: 'auto'
                    }}>
                        {modalBody}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={() => setModalShow(false)}>關閉</Button>
                    </Modal.Footer>
                </div>
            </Modal>

            <Marquee speed="120" play={isPlaying} autoFill={true} pauseOnClick={true} pauseOnHover={true} style={{ fontSize: "2.5rem", position: 'sticky', top: 0, zIndex: 1000, backgroundColor: "var(--secondary-color)" }}>

                {Cookies.get('version') == null && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginLeft: '500px', marginRight: '10px' }}>
                            <NotificationImportant style={{ color: "#B4E380", fontSize: '4rem' }} />
                        </span>
                        <span>
                            本網站會收集您的偏好以便提供更好的體驗, 相關資訊將保存至少2個月, 不同意者應停止使用我們的服務, 特此通知
                        </span>
                    </div>
                )}
                {/* <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginLeft: '500px', marginRight: '10px' }}>
                        <FiberNew style={{ color: "#B4E380", fontSize: '4rem' }} />
                    </span>
                    <span>
                        沖繩旅行電影已在網站上發布，需要的請下載前向 rm1主人 索取密碼，有效至{formatOpenDate(downloadEnd)}
                    </span>
                </div> */}

                {blockNote.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {blockNote.map((note, index) => (
                            <span key={index} style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginLeft: '200px', marginRight: '10px' }} >
                                    <ReportGmailerrorred style={{ color: "red", fontSize: '4rem' }} />
                                </span>
                                <span >
                                    {note.reason}，
                                    服務將於[{note.startTime}] 至 [{note.endTime}]暫時關閉
                                </span>
                            </span>
                        ))}
                    </div>
                ) : (
                    <span></span>
                )}

                {Object.keys(futureMoviesByMonth)
                    .sort()
                    .map((monthYear, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginLeft: '200px' }}>
                                <NewReleases style={{ color: "lightgreen", fontSize: '4rem' }} />
                            </span>
                            即將於 {monthYear}上映的劇集和電影有{futureMoviesByMonth[monthYear].length}部:

                            {futureMoviesByMonth[monthYear].map((movie, movieIndex) => (
                                <span style={{ listStyle: 'none', textDecoration: "underline" }} key={movieIndex}>
                                    <span style={{ marginLeft: '50px' }}>
                                        <FiberManualRecord style={{ width: '20px', height: '20px' }} />
                                    </span>
                                    {movie.title} ({movie.episodes}集) - {movie.language}
                                    <span style={{ marginLeft: '50px' }}>
                                    </span>
                                </span>
                            ))}
                        </div>
                    ))}
            </Marquee>
            {viewYTRecords != null ? (
                <h1 className="m-2 text-center">精選電影 ({viewYTRecords.length}部):</h1>
            ) : (
                <h1 className="m-2 text-center">精選電影:</h1>
            )}

            <main>
                {viewYTRecords === null ? (
                    <div className="no-results">
                        <h2>正在加載...</h2>
                    </div>
                ) : viewYTRecords.length === 0 ? (
                    <div className="no-results">
                        <h2>目前沒有上映的電影。</h2>
                    </div>
                ) : (
                    viewYTRecords.map((movie, index) => (
                        <div data-aos="flip-up" className="movie" style={{ backgroundColor: "#670014" }} onClick={() => handleYTBlockClick(movie.title)} key={index}>
                            <div className="img_container">
                                <img
                                    src={ytDataMap[movie.ytid]?.thumbnail_url || Not_found}
                                    alt="電影海報"
                                    className="movie_img set_size"
                                    loading="lazy"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = Not_found;
                                    }}
                                />
                                {(() => {
                                    const createDate = new Date(movie.createDate).getTime();
                                    const editDate = new Date(movie.editDate).getTime();
                                    const openDate = new Date(movie.openDate).getTime();

                                    if (openDate - currentTime > 0) {
                                        return (
                                            <span className="new_release" style={{ letterSpacing: 0 }}>
                                                即將上映<i className="new_release_icon fa-solid fa-bullhorn"></i>
                                            </span>
                                        );
                                    }
                                    if (86400000 * 3 > currentTime - editDate) {
                                        return (
                                            <span className="new_release" style={{ letterSpacing: 0 }}>
                                                已更新<i className="new_release_icon fa-solid fa-bullhorn"></i>
                                            </span>
                                        );
                                    }
                                    if (86400000 * 3 > currentTime - openDate) {
                                        return (
                                            <div className="new-sticker">
                                                <span className="sticker"></span>
                                                <span className="new">新!</span>
                                                <i className='new_release_icon fa-solid fa-bullhorn'></i>
                                            </div>
                                        );
                                    }
                                })()}
                            </div>
                            <div className="movie-info">
                                {new Date().getMonth() + 1 === 12 ? (
                                    <h3 className="animated">{movie.title}</h3>
                                ) : (
                                    <h3>{movie.title}</h3>
                                )}
                                <span style={{ backgroundColor: "#3f000d" }}>電影</span>
                            </div>
                            <div className="release_date" style={{ fontSize: "1.5rem" }}>
                                {(() => {
                                    const openDate = new Date(movie.openDate).getTime();
                                    if (openDate - currentTime > 0) {
                                        return <span>開播時間:{formatOpenDate(movie.openDate)}</span>;
                                    }
                                })()}
                            </div>
                            <div className="release_date" style={{ fontSize: "1.5rem" }}>
                                到期時間: <span>
                                    {(() => {
                                        const expiredDate = new Date(new Date(movie.expiredDate).getTime());
                                        const remainingTime = expiredDate - currentTime;
                                        const openDate = new Date(movie.openDate).getTime();
                                        if (movie.dbData) {
                                            return (
                                                <span className='bg-gradient'>
                                                    直至整套電影睇完<br />
                                                    剩餘 {Math.floor((movie.dbData.total_sec - movie.dbData.currentTime) / 60)}分鐘 {Math.floor((movie.dbData.total_sec - movie.dbData.currentTime) % 60)}秒<br />
                                                    共 {Math.floor(movie.dbData.total_sec / 60)}分鐘 {Math.floor((movie.dbData.total_sec - movie.dbData.currentTime) % 60)}秒
                                                </span>
                                            );
                                        } else if (remainingTime > 0 && openDate - currentTime < 0) {
                                            const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
                                            const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
                                            const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
                                            return (
                                                <span className='bg-gradient'>
                                                    {days}日 {hours}小時 {minutes}分鐘 {seconds}秒
                                                </span>
                                            );
                                        } else if (openDate - currentTime > 0) {
                                            return "尚未開播";
                                        } else {
                                            return "已到期";
                                        }
                                    })()}
                                </span>
                            </div>
                            <div className="overview">
                                <h3>電影名稱</h3>
                                <small>電影將在 YouTube 上觀看</small>
                                <p className='normal'>{ytDataMap[movie.ytid]?.title}</p>
                            </div>
                        </div>
                    ))
                )}

            </main>
            {viewTVRecords != null ? (
                <h1 className="m-2 text-center">精選劇集 ({viewTVRecords.length}部):</h1>
            ) : (
                <h1 className="m-2 text-center">精選劇集:</h1>
            )}
            <main >

                {
                    viewTVRecords === null ? (
                        <div className="loading-message">
                            <h2>正在加載...</h2> {/* Loading message */}
                        </div>
                    ) : viewTVRecords.length === 0 ? (
                        <div className="no-results">
                            <h2>目前沒有上映的劇集。</h2>
                        </div>
                    ) : (
                        viewTVRecords.map((movie, index) => (
                            <div data-aos="flip-up" className="movie" onClick={() => handleMovieBlockClick(movie.title)} key={index}>
                                <div className="img_container">
                                    <img
                                        src={TVSeriesDataMap[movie.title] || movie.image || Not_found}
                                        alt="電影海報"
                                        className="movie_img set_size"
                                        loading="lazy"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = { Not_found };
                                        }}
                                    />
                                    {(() => {
                                        const createDate = new Date(movie.createDate).getTime();
                                        const editDate = new Date(movie.editDate).getTime();
                                        const openDate = new Date(movie.openDate).getTime();

                                        if (openDate - currentTime > 0) {
                                            return (
                                                <span className="new_release" style={{ letterSpacing: 0 }}>
                                                    即將上映<i className="new_release_icon fa-solid fa-bullhorn"></i>
                                                </span>
                                            );
                                        }
                                        if (86400000 * 3 > currentTime - editDate) {
                                            return (
                                                <span className="new_release" style={{ letterSpacing: 0 }}>
                                                    已更新<i className="new_release_icon fa-solid fa-bullhorn"></i>
                                                </span>
                                            );
                                        }
                                        if (86400000 * 3 > currentTime - openDate) {
                                            return (
                                                <div className="new-sticker">
                                                    <span className="sticker"></span>
                                                    <span className="new">新!</span>
                                                    <i className='new_release_icon fa-solid fa-bullhorn'></i>
                                                </div>
                                            )
                                        }
                                    })()}
                                </div>
                                <div className="movie-info">
                                    {new Date().getMonth() + 1 === 12 ? (
                                        <h3 className="animated">{movie.title}</h3>
                                    )
                                        : (
                                            <h3>{movie.title}</h3>
                                        )}

                                    {(() => {
                                        if (!movie.notAll) {
                                            return (
                                                <span >{movie.episodes} 集</span>
                                            );
                                        } else {
                                            return (
                                                <span >更新至 {movie.episodes} 集</span>
                                            );
                                        }
                                    })()}

                                </div>
                                <div className="release_date" style={{ fontSize: "1.5rem" }}>

                                    {(() => {
                                        const openDate = new Date(movie.openDate).getTime();

                                        if (openDate - currentTime > 0) {
                                            return (
                                                <span>開播時間:{formatOpenDate(movie.openDate)}</span>
                                            );
                                        }
                                    })()}

                                </div>
                                <div className="release_date" style={{ fontSize: "1.5rem" }}>

                                    到期時間: <span>
                                        {(() => {
                                            const viewno = getExistEpValues(movie.title);
                                            const episodeAdjustmentFactor = Math.max(0, 1 - (movie.ep / 10)); // Ensure factor is between 0 and 1
                                            const expiredDate = new Date(new Date(movie.expiredDate).getTime() - (viewno * 1000 * 60 * 60 * 2));
                                            const remainingTime = expiredDate - currentTime;
                                            const openDate = new Date(movie.openDate).getTime();
                                            if (remainingTime > 0 && openDate - currentTime < 0) {
                                                const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
                                                const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                                const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
                                                const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
                                                return (
                                                    <span className='bg-gradient'>
                                                        {/* {expiredDate.toLocaleString()} */}
                                                        {days}日 {hours}小時 {minutes}分鐘 {seconds}秒
                                                    </span>
                                                );
                                            } else if (openDate - currentTime > 0) {
                                                return "尚未開播";
                                            } else {
                                                return "已到期";
                                            }
                                        })()}
                                    </span>
                                </div>
                            </div>
                        )))}
            </main>
            <div /* className="text-center" */>
                <Dropdown data-bs-theme="dark" className="mx-auto" drop="up-centered">
                    <Dropdown.Toggle variant="dark" id="dropdown-basic">
                        管理操作列表
                    </Dropdown.Toggle>

                    <Dropdown.Menu /* style={{ left: "38% !important", transform: "translateX(-50%)", position: "absolute" }} */>
                        <Dropdown.ItemText>輸入密碼即可訪問:</Dropdown.ItemText>
                        <Dropdown.Item onClick={() => handleAdminDropdownItemClick('新增')}>新增</Dropdown.Item>
                        <Dropdown.Item onClick={() => handleAdminDropdownItemClick('編輯')}>編輯</Dropdown.Item>
                        <Dropdown.Item onClick={() => handleAdminDropdownItemClick('刪除')}>刪除</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                {/*<Button variant="primary" size="lg">Primary</Button>
                    <Button variant="secondary" size="sm">Secondary</Button>
                    <Button variant="success" size="sm">Success</Button>
                    <Button variant="warning" size="sm">Warning</Button>
                    <Button variant="danger" size="sm">Danger</Button>
                    <Button variant="info">Info</Button>
                    <Button variant="light">Light</Button>
                    <Button variant="dark">Dark</Button>
                    <Button variant="link">Link</Button>*/}
            </div>
            <div>
            </div>
        </div>
    );
}