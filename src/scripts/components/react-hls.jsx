'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import Hls from 'hls.js';

class ReactHls extends React.Component {
    constructor (props) {
        super(props);

        this.hls = null;
        this.reloadAfterPause = false;
        this.reloaded = false;
        this.waitingTimeout = 0;
    }

    componentDidUpdate () {
        this._initPlayer();
    }

    componentDidMount () {
        this._initPlayer();
    }

    componentWillUnmount () {
        let { hls } = this;

        if (hls) {
            hls.destroy();
        }
    }

    _initPlayer () {
        if (this.hls) {
            this.hls.destroy();
        }

        let { url, autoplay, hlsConfig } = this.props;
        let { video: $video } = this.refs;

        if (Hls.isSupported()) {
            Hls.DefaultConfig.liveDurationInfinity = true;
            let hls = new Hls(hlsConfig);

            hls.loadSource(url);
            hls.attachMedia($video);

            $video.addEventListener('pause', function () {
                this.reloadAfterPause = true;
                hls.stopLoad();
                $video.pause();
            });

            $video.addEventListener('waiting', function () {
                if (this.waitingTimeout) {
                    clearTimeout(this.waitingTimeout);
                }
                this.waitingTimeout = setTimeout(() => {
                    if (!this.reloaded) {
                        this.reloaded = true;
                        $video.pause();
                        hls.loadSource(url);
                        hls.attachMedia($video);
                        $video.play().then(() => {
                            this.reloaded = false;
                        });
                    }
                }, 5000);
            });

            $video.addEventListener('timeupdate', function () {
                if (this.waitingTimeout) {
                    clearTimeout(this.waitingTimeout);
                }
            });

            $video.addEventListener('play', function () {
                if (this.waitingTimeout) {
                    clearTimeout(this.waitingTimeout);
                }
                if (hls !== null && this.reloadAfterPause) {
                    this.reloadAfterPause = false;
                    hls.loadSource(url);
                    hls.attachMedia($video);
                    hls.startLoad();
                    $video.load();
                }
            });

            $video.addEventListener('error', function () {
                this.reloadAfterPause = true;
                hls.stopLoad();
                $video.pause();
            });

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (autoplay) {
                    $video.play();
                }
            });
            this.hls = hls;
        } else if ($video.canPlayType('application/vnd.apple.mpegurl')) {
            $video.src = url;

            $video.addEventListener('canplay', function () {
                $video.play();
            })

            $video.addEventListener('pause', function () {
                this.reloadAfterPause = true;
            });

            $video.addEventListener('waiting', function () {
                if (this.waitingTimeout) {
                    clearTimeout(this.waitingTimeout);
                }
                this.waitingTimeout = setTimeout(() => {
                    if (!this.reloaded) {
                        this.reloaded = true;
                        $video.load();
                        $video.play().then(() => {
                            this.reloaded = false;
                        });
                    }
                }, 5000);
            });

            $video.addEventListener('timeupdate', function () {
                if (this.waitingTimeout) {
                    clearTimeout(this.waitingTimeout);
                }
            });

            $video.addEventListener('play', function () {
                if (this.waitingTimeout) {
                    clearTimeout(this.waitingTimeout);
                }
                if (this.reloadAfterPause) {
                    this.reloadAfterPause = false;
                    $video.load();
                    $video.play();
                }
            });

            $video.addEventListener('error', function () {
                this.reloadAfterPause = true;
                $video.pause();
            });
        }
    }

    render () {
        const { controls, muted, width, height, poster, playsinline  } = this.props;

        return (
            <div>
            <video
            ref="video"
            className="hls-player"
            controls={controls}
            muted={muted}
            width={width}
            height={height}
            poster={poster}
            playsInline={playsinline}>
            </video>
            </div>
        )
    }
}

ReactHls.propTypes = {
    url: PropTypes.string.isRequired,
    autoplay: PropTypes.bool,
    muted: PropTypes.bool,
    playsinline: PropTypes.bool,
    hlsConfig: PropTypes.object,  //https://github.com/dailymotion/hls.js/blob/master/API.md#fine-tuning
    controls: PropTypes.bool,
    width: PropTypes.string,
    height: PropTypes.string,
    poster: PropTypes.string,
}

ReactHls.defaultProps = {
    autoplay: false,
    hlsConfig: {},
    controls: true,
    muted: false,
    playsinline: true,
    poster: '',
    width: '100%',
    height: '100%'
}

export default ReactHls;
