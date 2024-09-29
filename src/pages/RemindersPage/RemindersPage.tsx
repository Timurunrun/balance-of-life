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
import Select from 'react-select';
import { timezones, TimezoneOption } from '../../utils/timezones';
export const RemindersPage: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState(1);
  const [time, setTime] = useState('12:00');
  const [isLoading, setIsLoading] = useState(true);
  const [currentReminder, setCurrentReminder] = useState<{ frequency: number; time: string; timezone: string } | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [timezone, setTimezone] = useState<TimezoneOption>(
    timezones.find(tz => tz.value === Intl.DateTimeFormat().resolvedOptions().timeZone) || timezones[0]
  );
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
        const matchedTimezone = timezones.find(tz => tz.value === reminder.timezone);
        setTimezone(matchedTimezone || timezones[0]);
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
      await setReminder(userId, frequency, time, timezone.value);
      toast({
        title: 'Напоминание установлено',
        description: `Вы будете получать уведомления каждые ${frequency} ${frequency === 1 ? 'день' : 'дн.'} в ${time} (${timezone.label})`,
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
            <Card borderRadius="xl" bg="#FFFFFF" boxShadow="lg">
              <CardHeader bg="#FFFFFF" borderTopRadius="xl">
                <Heading size="lg" fontFamily="Open Sans Regular" color="#">
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
                    <Box bg='#EEEEEE' p={4} borderRadius="md">
                      <Text color="#000000" fontWeight="bold">
                        Текущий период:
                      </Text>
                      <Text color="#000000">
                        {currentReminder 
                          ? `каждые ${currentReminder.frequency} ${currentReminder.frequency === 1 ? 'день' : 'дн.'} в ${currentReminder.time}`
                          : 'не установлено'}
                      </Text>
                    </Box>
                    <Box>
                      <Text mb={2} color="#000000" fontWeight="bold">Часовой пояс</Text>
                      <Select
                        options={timezones}
                        value={timezone}
                        onChange={(selectedOption) => setTimezone(selectedOption as TimezoneOption)}
                        placeholder="Выберите часовой пояс"
                        styles={{
                          control: (provided) => ({
                            ...provided,
                            backgroundColor: '#FFFFFF',
                            borderColor: 'var(--tg-theme-button-color)',
                            color: '#000000',
                          }),
                          singleValue: (provided) => ({
                            ...provided,
                            color: '#000000',
                          }),
                          menu: (provided) => ({
                            ...provided,
                            backgroundColor: '#FFFFFF',
                          }),
                          option: (provided, state) => ({
                            ...provided,
                            backgroundColor: state.isSelected
                              ? 'var(--tg-theme-button-color)'
                              : state.isFocused
                              ? 'var(--tg-theme-button-hover-color)'
                              : '#FFFFFF',
                            color: '#000000',
                          }),
                          menuList: (provided) => ({
                            ...provided,
                            maxHeight: '200px', // Set maximum height
                            overflowY: 'auto',  // Enable vertical scrolling
                          }),
                        }}
                        menuPlacement="auto" // Automatically decide menu placement
                        isSearchable
                      />
                    </Box>
                    <Box>
                      <Text mb={2} color='#000000' fontWeight="bold">Частота (в днях)</Text>
                      <NumberInput 
                        min={1} 
                        max={7} 
                        value={frequency} 
                        onChange={(_, value) => setFrequency(value)}
                        textColor='#000000'
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
                      <Text mb={2} color='#000000' fontWeight="bold">Время</Text>
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        textColor='#000000'
                        borderColor="var(--tg-theme-button-color)"
                      />
                    </Box>
                    <Button 
                      onClick={handleSetReminder} 
                      bg="var(--tg-theme-button-color)" 
                      color='#000000'
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
