import { FC, useState, useRef, useEffect } from 'react';
import { Box, Slider, SliderMark, SliderTrack, SliderThumb, Text, VStack, VisuallyHidden } from '@chakra-ui/react';
import { ArrowRight, Check } from 'lucide-react';
import { Layout } from '../../components/Layout';
// @ts-ignore
import { saveGoalValues, getGoals } from '../../../backend/databaseAPI';
import { authorizeUser } from '../../../backend/telegramAuth';

interface Goal {
  goal_id: number;
  goal_name: string;
  user_id: string;
  goal_order: number;
}

interface SliderValues {
  [key: string]: number;
}

const CustomToggle: FC<{ onConfirm: () => void; isAnimating: boolean }> = ({ onConfirm, isAnimating }) => {  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(5);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const toggleRef = useRef<HTMLDivElement>(null);

  const handleStart = () => {
    if (!isConfirmed) {
      setIsDragging(true);
    }
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !toggleRef.current || isConfirmed) return;
    const toggleRect = toggleRef.current.getBoundingClientRect();
    const maxPosition = toggleRect.width - 45;
    const newPosition = Math.max(0, Math.min(clientX - toggleRect.left, maxPosition));
    setPosition(newPosition);
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (!isConfirmed && position > (toggleRef.current?.offsetWidth || 0) * 0.8 - 45) {
      setPosition((toggleRef.current?.offsetWidth || 0) - 45);
      setIsConfirmed(true);
      onConfirm();
    } else if (!isConfirmed) {
      setPosition(5);
    }
  };

  useEffect(() => {
    if (isAnimating) {
      setPosition(5);
      setIsConfirmed(false);
    } else if (!isDragging && !isConfirmed && position > 0 && position < (toggleRef.current?.offsetWidth || 0) - 45) {
      const timer = setTimeout(() => setPosition(5), 300);
      return () => clearTimeout(timer);
    }
  }, [isDragging, position, isConfirmed, isAnimating]);

  return (
    <Box
      ref={toggleRef}
      w="70%"
      h="50px"
      m="auto"
      justifySelf={"center"}
      alignSelf={"center"}
      bgGradient="linear(to-r, #42ca8a, #83eda2)"
      borderRadius="full"
      position="relative"
      overflow="hidden"
      cursor={isConfirmed ? "default" : "pointer"}
      onMouseDown={() => handleStart()}
      onTouchStart={() => handleStart()}
      onMouseMove={(e) => handleMove(e.clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onMouseUp={handleEnd}
      onTouchEnd={handleEnd}
      onMouseLeave={handleEnd}
    >
      <Text
        position="absolute"
        left="50%"
        top="50%"
        transform="translate(-50%, -50%)"
        color="rgba(255, 255, 255, 0.7)"
        fontWeight="bold"
        fontSize="16px"
        transition="opacity 0.3s"
        opacity={isConfirmed ? 0 : 1}
        userSelect="none"
      >
        Протяните
      </Text>
      <Text
        position="absolute"
        left="50%"
        top="50%"
        transform="translate(-50%, -50%)"
        color="rgba(255, 255, 255, 0.7)"
        fontWeight="bold"
        fontSize="16px"
        transition="opacity 0.3s"
        opacity={isConfirmed ? 1 : 0}
        userSelect="none"
      >
        Супер!
      </Text>
      <Box
        w="40px"
        h="40px"
        bg="#FFFFFF"
        borderRadius="full"
        position="absolute"
        top="5px"
        left={`${position}px`}
        transition={isDragging ? "none" : "left 0.5s ease-out"}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {isConfirmed ? (
          <Check size={24} color="#42ca8a" />
        ) : (
          <ArrowRight size={24} color="#83eda2" />
        )}
      </Box>
    </Box>
  );
};

export const MainPage: FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sliderValues, setSliderValues] = useState<SliderValues>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authorizedUserId = await authorizeUser();
        setUserId(authorizedUserId);
        fetchGoals(authorizedUserId);
      } catch (error) {
        throw error;
      }
    };
  
    initAuth();
  }, []);
  
  const fetchGoals = async (authorizedUserId: string) => {
    try {
      const fetchedGoals: Goal[] = await getGoals(authorizedUserId);
      setGoals(fetchedGoals);
      setSliderValues(fetchedGoals.reduce((acc: SliderValues, goal) => ({...acc, [goal.goal_id]: 1}), {}));
      setGoalsLoaded(true);
    } catch (error) {
    }
  };

  const handleSliderChange = (goalId: number, value: number) => {
    setSliderValues(prev => ({...prev, [goalId]: value}));
  };

  const handleConfirm = async () => {
    if (!userId) {
      return;
    }
  
    try {
      const values = Object.entries(sliderValues).map(([goalId, value]) => ({
        goalId: parseInt(goalId),
        value: value
      }));
      await saveGoalValues(userId, values);
      
      setTimeout(() => {
        setIsAnimating(true);
        
        setTimeout(() => {
          setSliderValues(goals.reduce((acc: SliderValues, goal) => ({...acc, [goal.goal_id]: 1}), {}));
          setIsAnimating(false);
        }, 1000);
      }, 1000);
    } catch (error) {
      throw error;
    }
  };
  
  return (
    <Layout userId={userId}>
      <Box 
        bg="#FFFFFF" 
        borderRadius="xl" 
        pt={6}
        px={6}
        w="full" 
        maxW="90%" 
        mt="80px"
        boxShadow="lg"
        opacity={goalsLoaded && !isAnimating ? 1 : 0}
        maxHeight={goalsLoaded && !isAnimating ? "2000px" : "0px"}
        transition="opacity 0.5s ease-in-out, max-height 0.5s ease-in-out"
        overflow="hidden"
      >
        <VStack as="main" w="full" pb="40px">
          <Box w="full">
            {goals.map((goal) => (
              <Box key={goal.goal_id} mb={8}>
                <Text fontSize="lg" fontFamily={"Open Sans Regular"} color="#000000" mb={2}>{goal.goal_order}. {goal.goal_name}</Text>
                <Slider
                  value={sliderValues[goal.goal_id]}
                  onChange={(value) => handleSliderChange(goal.goal_id, value)}
                  min={1}
                  max={5}
                  step={1}
                  aria-label={`Оценка для ${goal.goal_name}`}
                >
                  <SliderTrack bgGradient="linear(to-r, red.300, yellow.300, green.500)" />
                  {[1, 2, 3, 4, 5].map((value) => (
                    <SliderMark
                      key={value}
                      value={value}
                      mt={3}
                      ml={-1}
                      fontSize="sm"
                      color="#999999"
                    >
                      {value}
                    </SliderMark>
                  ))}
                  <SliderThumb boxSize={6}>
                    <VisuallyHidden>{sliderValues[goal.goal_id]}</VisuallyHidden>
                  </SliderThumb>
                </Slider>
              </Box>
            ))}
          </Box>
          <Box w="full">
            <CustomToggle onConfirm={handleConfirm} isAnimating={isAnimating} />
          </Box>
        </VStack>
      </Box>
    </Layout>
  );
};