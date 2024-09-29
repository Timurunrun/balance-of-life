import React, { FC, useState, useEffect } from 'react';
import { 
  Box, VStack, Text, Flex, IconButton, Input, useDisclosure, 
  AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogBody, 
  AlertDialogCloseButton, Button, useToast 
} from '@chakra-ui/react';
import { PencilLine, Plus, Trash2 } from 'lucide-react';
import { Layout } from '../../components/Layout';
// @ts-ignore
import { getGoals, updateGoal, deleteGoal, addGoal, reorderGoals, getPremiumStatus } from '../../../backend/databaseAPI';
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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false);

  const toast = useToast();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authorizedUserId = await authorizeUser();
        setUserId(authorizedUserId);
        fetchGoals(authorizedUserId);
        const premiumStatus = await getPremiumStatus(authorizedUserId);
        setIsPremium(premiumStatus);
      } catch (error) {
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
      const fetchedGoals: Goal[] = await getGoals(authorizedUserId);
      setGoals(fetchedGoals);
      setGoalOrder(fetchedGoals.map(goal => goal.goal_id).sort((a, b) => a - b));
      setGoalsLoaded(true);
    } catch (error) {
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

  const confirmDeleteGoal = (goal: Goal) => {
    setGoalToDelete(goal);
    onOpen();
  };
  
  const handleConfirmDeleteGoal = async () => {
    if (goalToDelete && userId) {
      try {
        await deleteGoal(goalToDelete.goal_id, userId);
        const updatedGoals = goals.filter(goal => goal.goal_id !== goalToDelete.goal_id);
        const updatedOrder = goalOrder.filter(id => id !== goalToDelete.goal_id);
        setGoals(updatedGoals);
        setGoalOrder(updatedOrder);
        await reorderGoals(userId, updatedOrder);
        setGoalToDelete(null);
        onClose();
      } catch (error) {
        toast({
          title: "Проблема",
          description: "При удалении вашей цели произошла проблема.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleAddButtonClick = () => {
    if (goals.length >= 5 && !isPremium) {
      toast({
        title: "Потребуется полная версия",
        description: "Для добавления более 5 целей необходимо приобрести полную версию.",
        status: "info",
        duration: 2000,
        isClosable: false,
      });
    } else {
      setEditingGoal(null);
      setNewGoalName('');
      onOpen();
    }
  };

  const handleAddGoal = async () => {
    if (newGoalName.trim() && userId) {
      try {
        const result = await addGoal(userId, newGoalName, goals.length + 1);
        
        if (!result.lastID) {
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
          return updatedGoals;
        });
        
        setGoalOrder(prevOrder => {
          const updatedOrder = [...prevOrder, newGoal.goal_id];
          return updatedOrder;
        });
        
        setNewGoalName('');
        onClose();
      } catch (error) {
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
  
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Layout userId={userId}>
      <Box 
        bg="#FFFFFF" 
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
                    <Text key={`text-${goal.goal_id}`} fontSize="lg" fontFamily={"Open Sans Regular"} color="#000000">{index + 1}. {goal.goal_name}</Text>
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
                        onClick={() => confirmDeleteGoal(goal)}
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

      {/* Add Button */}
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
          onClick={handleAddButtonClick}
          size="lg"
          isDisabled={goals.length >= 15}
          boxShadow="lg"
        />
      </Flex>

      {/* AlertDialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => {
          setGoalToDelete(null);
          onClose();
        }}
      >
        <AlertDialogOverlay>
          <AlertDialogContent maxWidth="90%" bg="#FFFFFF">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="#000000">
              {goalToDelete ? 'Подтвердите удаление' : editingGoal ? 'Изменить цель' : 'Добавить цель'}
            </AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody color="#000000">
              {goalToDelete ? (
                <Text>Вы уверены, что хотите удалить цель «{goalToDelete.goal_name}»? Это приведет к очистке всех связанных с ней данных.</Text>
              ) : (
                <>
                  <Input
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    placeholder="Введите цель"
                    maxLength={10}
                  />
                  <Text mt={2} color="var(--tg-theme-subtitle-text-color)" fontSize="sm">{newGoalName.length}/10 букв</Text>
                </>
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              {goalToDelete ? (
                <>
                  <Button colorScheme="red" onClick={handleConfirmDeleteGoal}>
                    Удалить
                  </Button>
                  <Button variant="ghost" color="#000000" _hover={{ }} ref={cancelRef} onClick={() => {
                    setGoalToDelete(null);
                    onClose();
                  }}>
                    Отмена
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    colorScheme="blue"
                    mr={3}
                    onClick={editingGoal ? handleUpdateGoal : handleAddGoal}
                    isDisabled={newGoalName.length > 10 || !newGoalName.trim()}
                  >
                    {editingGoal ? 'Обновить' : 'Добавить'}
                  </Button>
                  <Button variant="ghost" color="#000000" _hover={{ }} ref={cancelRef} onClick={onClose}>Закрыть</Button>
                </>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  );
};