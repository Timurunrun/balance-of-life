import React, { useState } from 'react';

const ToggleSwitch = ({ onConfirm }) => {
    const [isActive, setIsActive] = useState(false);

    const handleTouchStart = (event) => {
        const initialX = event.touches[0].clientX;

        const handleTouchMove = (moveEvent) => {
            if (!isActive && moveEvent.touches[0].clientX - initialX > 100) { // Assuming 100 is the threshold for activation
                setIsActive(true);
                onConfirm();
                document.removeEventListener('touchmove', handleTouchMove);
            }
        };

        document.addEventListener('touchmove', handleTouchMove);

        const handleTouchEnd = () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };

        document.addEventListener('touchend', handleTouchEnd);
    };

    return (
        <div
            style={{
                width: '300px', // Adjusted width for a longer switch
                height: '50px',
                backgroundColor: isActive ? 'green' : 'grey',
                borderRadius: '25px',
                position: 'relative',
                cursor: 'pointer',
            }}
            onTouchStart={handleTouchStart}
        >
            <div
                style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    left: isActive ? '250px' : '0px', // Adjusted position for a longer switch
                    transition: 'left 0.3s',
                }}
            />
        </div>
    );
};

const MainPage = () => {
    const handleConfirm = () => {
        console.log("Confirmed!");
    };

    return (
        <div>
            <ToggleSwitch onConfirm={handleConfirm} />
        </div>
    );
};

export default MainPage;
