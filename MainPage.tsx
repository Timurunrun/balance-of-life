import React, { useState } from 'react';

const ToggleSwitch = ({ onConfirm }) => {
    const [isActive, setIsActive] = useState(false);

    const handleDrag = (event) => {
        if (!isActive && event.clientX > 100) { // Assuming 100 is the threshold for activation
            setIsActive(true);
            onConfirm();
        }
    };

    const handleMouseDown = (event) => {
        event.preventDefault(); // Prevent default behavior to ensure dragging only
    };

    return (
        <div
            style={{
                width: '200px',
                height: '50px',
                backgroundColor: isActive ? 'green' : 'grey',
                borderRadius: '25px',
                position: 'relative',
                cursor: 'pointer',
            }}
            onMouseMove={handleDrag}
            onMouseDown={handleMouseDown}
        >
            <div
                style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    left: isActive ? '150px' : '0px',
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
