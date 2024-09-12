import React, { FC, useState, useEffect } from 'react';
import { 
  Box, Heading, VStack, Text, Flex, IconButton, Input, useDisclosure, 
  AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogBody, 
  AlertDialogCloseButton, Button, useToast 
} from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Crown, User, PencilLine, Home, Target, BarChart3, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
// @ts-ignore
import { getGoals, updateGoal, deleteGoal, addGoal, reorderGoals } from '../../../backend/databaseAPI';
import { authorizeUser } from '../../../backend/telegramAuth';
import { motion, AnimatePresence } from 'framer-motion';

interface Goal {
  goal_id: number;
  goal_name: string;
  user_id: string;
  goal_order: number;
}

export const GoalsPage: FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalOrder, setGoalOrder] = useState<number[]>([]);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoalName, setNewGoalName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing authentication');
        const authorizedUserId = await authorizeUser();
        console.log('Authorized user ID:', authorizedUserId);
        setUserId(authorizedUserId);
        fetchGoals(authorizedUserId);
      } catch (error) {
        console.error('Authorization failed:', error);
        setIsLoading(false);
        toast({
          title: "Авторизация не удалась",
          description: "У нас не получилось вас узнать. Пожалуйста, попробуйте снова.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    initAuth();
  }, []);

  const fetchGoals = async (authorizedUserId: string) => {
    try {
      console.log('Fetching goals for user:', authorizedUserId);
      const fetchedGoals: Goal[] = await getGoals(authorizedUserId);
      console.log('Fetched goals:', fetchedGoals);
      setGoals(fetchedGoals);
      setGoalOrder(fetchedGoals.map(goal => goal.goal_id).sort((a, b) => a - b));
      setIsLoading(false);
      setGoalsLoaded(true); // Set goalsLoaded to true after fetching
    } catch (error) {
      console.error('Error fetching goals:', error);
      setIsLoading(false);
      toast({
        title: "Проблема",
        description: "Нам не удалось загрузить ваши цели. Пожалуйста, попробуйте ещё раз.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoalName(goal.goal_name);
    onOpen();
  };

  const handleUpdateGoal = async () => {
    if (editingGoal && newGoalName.trim() && userId) {
      try {
        await updateGoal(editingGoal.goal_id, newGoalName, userId);
        setGoals(goals.map(goal => 
          goal.goal_id === editingGoal.goal_id ? { ...goal, goal_name: newGoalName } : goal
        ));
        onClose();
      } catch (error) {
        console.error('Error updating goal:', error);
        toast({
          title: "Проблема",
          description: "Нам не удалось обновить ваши цели. Пожалуйста, попробуйте ещё раз.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    if (goals.length > 1 && userId) {
      try {
        await deleteGoal(goalId, userId);
        const updatedGoals = goals.filter(goal => goal.goal_id !== goalId);
        const updatedOrder = goalOrder.filter(id => id !== goalId);
        setGoals(updatedGoals);
        setGoalOrder(updatedOrder);
        await reorderGoals(userId, updatedOrder);
      } catch (error) {
        console.error('Error deleting goal:', error);
        toast({
          title: "Проблема",
          description: "При удалении вашей цели произошла проблема.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } else {
      toast({
        title: "Это последняя цель",
        description: "В списке должна остаться хотя бы одна цель.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddGoal = async () => {
    if (newGoalName.trim() && userId) {
      try {
        console.log('Adding new goal:', newGoalName);
        const result = await addGoal(userId, newGoalName, goals.length + 1);
        console.log('Result from addGoal:', result);
        
        if (!result.lastID) {
          console.error('New goal does not have a valid lastID');
          throw new Error('Invalid lastID');
        }
  
        const newGoal: Goal = {
          goal_id: result.lastID,
          goal_name: newGoalName,
          user_id: userId,
          goal_order: goals.length + 1
        };
  
        setGoals(prevGoals => {
          const updatedGoals = [...prevGoals, newGoal];
          console.log('Updated goals state:', updatedGoals);
          return updatedGoals;
        });
        
        setGoalOrder(prevOrder => {
          const updatedOrder = [...prevOrder, newGoal.goal_id];
          console.log('Updated goal order:', updatedOrder);
          return updatedOrder;
        });
        
        setNewGoalName('');
        onClose();
      } catch (error) {
        console.error('Error adding goal:', error);
        toast({
          title: "Проблема",
          description: "При добавлении вашей цели произошла проблема.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  // Tabbar component
  const Tabbar: FC<{ children: React.ReactNode }> = ({ children }) => (
    <Flex
      as="nav"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="var(--tg-theme-header-bg-color)" 
      justifyContent="space-around"
      py={2}
      zIndex={20}
    >
      {children}
    </Flex>
  );

  // Tabbar.Item component
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
    >
      <Box mb={1}>{children}</Box>
      <Text fontSize="xs" userSelect="none">{text}</Text>
    </Flex>
  );
  
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minH="100vh"
      pb={8}
      bgGradient="linear(135deg, #38d4bf, #38d056)"
    >
      
      {/* Header */}
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
        <Crown size={24} color="#ffd700" />
        <Heading fontSize="2xl" color="var(--tg-theme-text-color)" style={{letterSpacing: 0.1}} fontFamily={"Open Sans Regular, Erewhon Regular"}>Баланс жизни</Heading>
        <User size={24} color="var(--tg-theme-hint-color)" />
      </Flex>
  
      <Box 
        bg="var(--tg-theme-bg-color)" 
        borderRadius="xl" 
        pt={6}
        w="full" 
        maxW="90%" 
        mt="80px"
        mb="80px"
        boxShadow="lg"
        opacity={goalsLoaded ? 1 : 0}
        maxHeight={goalsLoaded ? "2000px" : "0px"}
        transition="opacity 0.5s ease-in-out, max-height 0.5s ease-in-out"
        overflow="hidden"
      >

        {/* Main Content */}
        <VStack as="main" w="full" spacing={4} paddingX={7} pb="40px" flex={1} overflowY="auto">
        <Box height="10px" />
          <AnimatePresence>
            {goalOrder.map((goalId, index) => {
              const goal = goals.find(g => g.goal_id === goalId);
              if (!goal) return null;
              return (
                <motion.div
                  key={`goal-${goal.goal_id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  layout
                  style={{ width: '100%' }}
                >
                  <Flex 
                    borderColor='var(--tg-theme-section-separator-color)' 
                    className="w-full justify-between items-center border-b pb-2"
                  >
                    <Text key={`text-${goal.goal_id}`} fontSize="lg" fontFamily={"Open Sans Regular"} color="var(--tg-theme-text-color)">{index + 1}. {goal.goal_name}</Text>
                    <Box key={`box-${goal.goal_id}`}>
                      <IconButton
                        key={`edit-${goal.goal_id}`}
                        aria-label="Изменить цель"
                        icon={<PencilLine size={20} />}
                        variant="ghost"
                        color="#ff9900"
                        onClick={() => handleEditGoal(goal)}
                        mr={2}
                      />
                      <IconButton
                        key={`delete-${goal.goal_id}`}
                        aria-label="Удалить цель"
                        icon={<Trash2 size={20} />}
                        variant="ghost"
                        color="var(--tg-theme-hint-color)"
                        onClick={() => handleDeleteGoal(goal.goal_id)}
                        isDisabled={goals.length <= 1}
                      />
                    </Box>
                  </Flex>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </VStack>
      </Box>

      {/* Add Button - Moved outside the Box and positioned at the bottom */}
      <Flex 
        position="fixed" 
        bottom="80px" 
        left="0" 
        right="0" 
        justifyContent="center" 
        zIndex={15}
      >
        <IconButton
          aria-label="Добавить цель"
          icon={<Plus size={24} />}
          colorScheme="green"
          borderRadius="full"
          onClick={() => {
            setEditingGoal(null);
            setNewGoalName('');
            onOpen();
          }}
          size="lg"
          isDisabled={goals.length >= 15}
          boxShadow="lg"
        />
      </Flex>

      {/* Edit/Add Goal AlertDialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {editingGoal ? 'Изменить цель' : 'Добавить цель'}
            </AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody>
              <Input
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                placeholder="Введите цель"
                maxLength={10}
              />
              <Text mt={2} color="var(--tg-theme-subtitle-text-color)" fontSize="sm">{newGoalName.length}/10 букв</Text> {/* Display character count */}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                colorScheme="blue"
                mr={3}
                onClick={editingGoal ? handleUpdateGoal : handleAddGoal}
                isDisabled={newGoalName.length > 10 || !newGoalName.trim()} // Disable if goal exceeds 10 characters
              >
                {editingGoal ? 'Обновить' : 'Добавить'}
              </Button>
              <Button variant="ghost" ref={cancelRef} onClick={onClose}>Закрыть</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

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