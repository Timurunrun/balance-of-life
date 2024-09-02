import React, { useState } from 'react';

const ToggleSwitch = ({ onConfirm }) => {
    const [isActive, setIsActive] = useState(false);

    const handleMouseDown = (event) => {
        event.preventDefault(); // Prevent default behavior to ensure dragging only
        const initialX = event.clientX;

        const handleMouseMove = (moveEvent) => {
            if (!isActive && moveEvent.clientX - initialX > 100) { // Assuming 100 is the threshold for activation
                setIsActive(true);
                onConfirm();
                document.removeEventListener('mousemove', handleMouseMove);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mouseup', handleMouseUp);
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
