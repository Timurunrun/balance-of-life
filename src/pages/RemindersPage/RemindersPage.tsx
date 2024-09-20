import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Card,
  CardHeader,
  CardBody,
  Text,
  Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Input,
  useToast,
  Heading,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../../components/Layout';
import { authorizeUser } from '../../../backend/telegramAuth';
//@ts-ignore
import { setReminder, getReminder } from '../../../backend/databaseAPI';

export const RemindersPage: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState(1);
  const [time, setTime] = useState('12:00');
  const [isLoading, setIsLoading] = useState(true);
  const [currentReminder, setCurrentReminder] = useState<{ frequency: number; time: string } | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authorizedUserId = await authorizeUser();
        setUserId(authorizedUserId);
        await fetchCurrentReminder(authorizedUserId);
        setDataLoaded(true);
      } catch (error) {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (dataLoaded) {
      setTimeout(() => setContentLoaded(true), 100);
    }
  }, [dataLoaded]);

  const fetchCurrentReminder = async (userId: string) => {
    setIsLoading(true);
    try {
      const reminder = await getReminder(userId);
      setCurrentReminder(reminder);
      if (reminder) {
        setFrequency(reminder.frequency);
        setTime(reminder.time);
      }
    } catch (error) {
      console.error('Error fetching reminder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetReminder = async () => {
    if (!userId) return;

    try {
      await setReminder(userId, frequency, time);
      toast({
        title: 'Напоминание установлено',
        description: `Вы будете получать уведомления каждые ${frequency} ${frequency === 1 ? 'день' : 'дня'} в ${time}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchCurrentReminder(userId);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось установить напоминание',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Layout userId={userId}>
      <Flex 
        direction="column" 
        flex="1" 
        w="full" 
        maxW="90%" 
        mx="auto" 
        mt="80px" 
        mb="20px" 
        fontFamily="Open Sans Regular"
        opacity={contentLoaded ? 1 : 0}
        maxHeight={contentLoaded ? "2000px" : "0px"}
        transition="opacity 0.5s ease-in-out, max-height 0.5s ease-in-out"
        overflow="hidden"
      >
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card borderRadius="xl" bg="var(--tg-theme-bg-color)" boxShadow="lg">
              <CardHeader bg="var(--tg-theme-secondary-bg-color)" borderTopRadius="xl">
                <Heading size="lg" fontFamily="Open Sans Regular" color="var(--tg-theme-text-color)">
                  Настройка напоминаний
                </Heading>
              </CardHeader>
              <CardBody p={6}>
                {isLoading ? (
                  <Flex justify="center" align="center" height="200px">
                    <Spinner size="xl" color="var(--tg-theme-button-color)" />
                  </Flex>
                ) : (
                  <VStack spacing={6} align="stretch">
                    <Box bg="var(--tg-theme-secondary-bg-color)" p={4} borderRadius="md">
                      <Text color="var(--tg-theme-text-color)" fontWeight="bold">
                        Текущий период:
                      </Text>
                      <Text color="var(--tg-theme-text-color)">
                        {currentReminder 
                          ? `каждые ${currentReminder.frequency} ${currentReminder.frequency === 1 ? 'день' : 'дня'} в ${currentReminder.time}`
                          : 'не установлено'}
                      </Text>
                    </Box>
                    <Box>
                      <Text mb={2} color="var(--tg-theme-text-color)" fontWeight="bold">Частота (в днях)</Text>
                      <NumberInput 
                        min={1} 
                        max={7} 
                        value={frequency} 
                        onChange={(_, value) => setFrequency(value)}
                        textColor="var(--tg-theme-text-color)"
                        borderColor="var(--tg-theme-button-color)"
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </Box>
                    <Box>
                      <Text mb={2} color="var(--tg-theme-text-color)" fontWeight="bold">Время</Text>
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        textColor="var(--tg-theme-text-color)"
                        borderColor="var(--tg-theme-button-color)"
                      />
                    </Box>
                    <Button 
                      onClick={handleSetReminder} 
                      bg="var(--tg-theme-button-color)" 
                      color="var(--tg-theme-button-text-color)"
                      _hover={{ opacity: 0.8 }}
                      size="lg"
                    >
                      Установить напоминание
                    </Button>
                  </VStack>
                )}
              </CardBody>
            </Card>
          </motion.div>
        </AnimatePresence>
      </Flex>
    </Layout>
  );
};