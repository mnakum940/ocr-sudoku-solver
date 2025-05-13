import React from 'react';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="social-links">
                    <a 
                        href="https://github.com/mnakum940" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="social-link"
                    >
                        <i className="fab fa-github"></i> GitHub
                    </a>
                    <a 
                        href="https://instagram.com/mnakum940" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="social-link"
                    >
                        <i className="fab fa-instagram"></i> Instagram
                    </a>
                    <a 
                        href="https://linkedin.com/in/mnakum940" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="social-link"
                    >
                        <i className="fab fa-linkedin"></i> LinkedIn
                    </a>
                </div>
                <div className="copyright">
                    © {currentYear} Meet Nakum. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer; 