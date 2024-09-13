import React, { FC, useState, useRef, useEffect } from 'react';
import { Box, Flex, Heading, Slider, SliderMark, SliderTrack, SliderThumb, Text, VStack, VisuallyHidden } from '@chakra-ui/react';
import { Crown, User, Home, Target, BarChart3, ArrowRight, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
// @ts-ignore
import { saveGoalValues, getGoals } from '../../../backend/databaseAPI';
import { authorizeUser } from '../../../backend/telegramAuth';
// @ts-ignore
import { createInvoiceLink } from '../../../backend/starsAPI';

interface Goal {
  goal_id: number;
  goal_name: string;
  user_id: string;
  goal_order: number;
}

interface SliderValues {
  [key: string]: number;
}

const CustomToggle: FC<{ onConfirm: () => void }> = ({ onConfirm }) => {
  const [isDragging, setIsDragging] = useState(false);
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
    if (!isDragging && !isConfirmed && position > 0 && position < (toggleRef.current?.offsetWidth || 0) - 45) {
      const timer = setTimeout(() => setPosition(5), 300);
      return () => clearTimeout(timer);
    }
  }, [isDragging, position, isConfirmed]);

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
        bg="var(--tg-theme-bg-color)"
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

const Tabbar: FC<{ children: React.ReactNode }> = ({ children }) => (
  <Flex
    as="nav"
    position="fixed"
    bottom={0}
    left={0}
    right={0}
    bg="var(--tg-theme-bg-color)"
    justifyContent="space-around"
    py={2}
    borderTopWidth={1} 
    borderTopColor="var(--tg-theme-section-separator-color)" 
    zIndex={20}
  >
    {children}
  </Flex>
);

const TabbarItem: FC<{ children: React.ReactNode; text: string; selected?: boolean; onClick: () => void }> = ({ children, text, selected = false, onClick }) => (
  <Flex
    direction="column"
    align="center"
    justify="center"
    flex={1}
    py={1}
    color={selected ? "var(--tg-theme-link-color)" : "var(--tg-theme-hint-color)"}
    onClick={onClick}
    cursor="pointer"
    height="100%"
    zIndex={15}
    role="button"
    aria-label={text}
    aria-selected={selected}
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onClick();
      }
    }}
  >
    <Box mb={1}>{children}</Box>
    <Text fontSize="xs" userSelect="none">{text}</Text>
    </Flex>
);

export const MainPage: FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sliderValues, setSliderValues] = useState<SliderValues>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [goalsLoaded, setGoalsLoaded] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authorizedUserId = await authorizeUser();
        setUserId(authorizedUserId);
        fetchGoals(authorizedUserId);
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    };
  
    initAuth();
  }, []);

  const handleBuyPremium = async () => {
    await createInvoiceLink('Полный доступ', 'Возможность создавать до 15 целей', userId, [{label: 'Full access', amount: 1}]);
  }
  
  const fetchGoals = async (authorizedUserId: string) => {
    try {
      const fetchedGoals: Goal[] = await getGoals(authorizedUserId);
      setGoals(fetchedGoals);
      setSliderValues(fetchedGoals.reduce((acc: SliderValues, goal) => ({...acc, [goal.goal_id]: 1}), {}));
      setIsLoading(false);
      setGoalsLoaded(true);
    } catch (error) {
      setIsLoading(false);
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
      
      const delay = 1000;
      setTimeout(() => {
        setIsLoading(true);
        fetchGoals(userId);
      }, delay);
    } catch (error) {
      throw error;
    }
  };
  
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minH="100vh"
      pb={20}
      bgGradient="linear(135deg, #38d4bf, #38d056)"
    >
      <Flex 
        as="header" 
        bg="var(--tg-theme-header-bg-color)" 
        w="full" 
        position="fixed" 
        top={0} 
        left={0} 
        justify="space-between" 
        align="center" 
        p={4} 
        borderBottomWidth={1} 
        borderBottomColor="var(--tg-theme-section-separator-color)" 
        zIndex={10}
      >
        <Box onClick={handleBuyPremium} cursor="pointer">
          <Crown size={24} color="#ffd700" />
        </Box>
        <Heading fontSize="2xl" color="var(--tg-theme-text-color)" style={{letterSpacing: 0.1}} fontFamily={"Open Sans Regular, Erewhon Regular"}>Баланс жизни</Heading>
        <User size={24} color="var(--tg-theme-hint-color)" />
      </Flex>

      <Box 
        bg="var(--tg-theme-bg-color)" 
        borderRadius="xl" 
        pt={6}
        px={6}
        w="full" 
        maxW="90%" 
        mt="80px"
        boxShadow="lg"
        opacity={goalsLoaded ? 1 : 0}
        maxHeight={goalsLoaded ? "2000px" : "0px"}
        transition="opacity 0.5s ease-in-out, max-height 0.5s ease-in-out"
        overflow="hidden"
      >
        <VStack as="main" w="full" pb="40px">
          <Box w="full">
            {goals.map((goal) => (
              <Box key={goal.goal_id} mb={8}>
                <Text fontSize="lg" fontFamily={"Open Sans Regular"} color="var(--tg-theme-text-color)" mb={2}>{goal.goal_order}. {goal.goal_name}</Text>
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
                      color="var(--tg-theme-hint-color)"
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
            <CustomToggle onConfirm={handleConfirm} />
          </Box>
        </VStack>
      </Box>

      <Tabbar>
        <TabbarItem 
          text="Сегодня" 
          selected={location.pathname === '/'} 
          onClick={() => navigate('/')}
        >
          <Home size={24} />
        </TabbarItem>
        <TabbarItem 
          text="Цели" 
          selected={location.pathname === '/goals'} 
          onClick={() => navigate('/goals')}
        >
          <Target size={24} />
        </TabbarItem>
        <TabbarItem 
          text="Статистика" 
          selected={location.pathname === '/statistics'} 
          onClick={() => navigate('/statistics')}
        >
          <BarChart3 size={24} />
        </TabbarItem>
      </Tabbar>
    </Flex>
  );
};