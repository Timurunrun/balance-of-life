import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Select,
  Card,
  CardHeader,
  CardBody,
  Text,
  SimpleGrid,
  Badge,
  List,
  ListItem,
  Spinner,
  Flex,
  Heading,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../../components/Layout';

//@ts-ignore
import { getStatistics } from '../../../backend/databaseAPI';
import { authorizeUser } from '../../../backend/telegramAuth';

const COLORS = ['#84a88e', '#e6c9a1', '#82afb4ff', '#e6715bff', '#dcae59', '#3b6d6e', '#6f6471', '#cadacc', '#82afb4', '#f39c85', '#e6715b', '#e8c374', '#3a978c', '#fbf2c4', '#c7522a'];

interface AspectRating {
  aspect: string;
  rating: number;
}

interface UserData {
  week: AspectRating[];
  month: AspectRating[];
  year: AspectRating[];
}

const calculateAverage = (data: AspectRating[]): string => {
  if (!data || data.length === 0) return '0.0';
  const sum = data.reduce((acc, item) => acc + item.rating, 0);
  return (sum / data.length).toFixed(1);
};

const findHighestRated = (data: AspectRating[]): AspectRating | null => {
  if (!data || data.length === 0) return null;
  return data.reduce((max, item) => (item.rating > max.rating ? item : max));
};

const findLowestRated = (data: AspectRating[]): AspectRating | null => {
  if (!data || data.length === 0) return null;
  return data.reduce((min, item) => (item.rating < min.rating ? item : min));
};

const CircularProgressChart = ({ value, max, label, color }: { value: number; max: number; label: string; color: string }) => {
  const percentage = (value / max) * 100;
  const strokeWidth = 10;
  const radius = 50 - strokeWidth / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const lighterColor = `${color}70`;

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <defs>
          <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={lighterColor} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle
          strokeWidth={strokeWidth}
          stroke="#E5E5E5"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        <circle
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={`url(#gradient-${label})`}
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        <text x="50" y="50" fontSize="20" textAnchor="middle" dy="7" fill={color}>
          {value}
        </text>
      </svg>
      <Text fontSize="sm" mt={1} color="#000000">{label}</Text>
    </Box>
  );
};

export const StatisticsPage: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authorizedUserId = await authorizeUser();
        setUserId(authorizedUserId);
        fetchStatistics(authorizedUserId, period);
      } catch (error) {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchStatistics(userId, period);
    }
  }, [userId, period]);
  
  useEffect(() => {
    if (dataLoaded) {
      setTimeout(() => setContentLoaded(true), 100);
    }
  }, [dataLoaded]);

  const fetchStatistics = async (userId: string, period: string) => {
    setIsLoading(true);
    setDataLoaded(false);
    try {
      const data = await getStatistics(userId, period);
      setUserData(data);
    } catch (error) {
      setUserData(null);
    } finally {
      setIsLoading(false);
      setDataLoaded(true);
    }
  };

  const data = userData?.[period] || [];
  const averageRating = calculateAverage(data);
  const highestRated = findHighestRated(data);
  const lowestRated = findLowestRated(data);

  return (
    <Layout userId={userId}>
      <Box 
        w="full" 
        maxW="90%" 
        mt="80px"
        mb="80px"
        borderRadius="xl"
        opacity={contentLoaded ? 1 : 0}
        maxHeight={contentLoaded ? "2000px" : "0px"}
        transition="opacity 0.5s ease-in-out, max-height 0.5s ease-in-out"
        overflow="hidden"
      >
        <VStack spacing={6} align="stretch" px={4} pb="40px" fontFamily={"Open Sans Regular"}>
          <Box bg="#FFFFFF" borderRadius="xl" p={4} boxShadow="md">
            <Text as="h2" size="md" mb={2} color="#000000" fontFamily={"Open Sans Regular"}>
              Выберите временной промежуток
            </Text>
            <Select value={period} color="#000000" onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'year')}>
              <option value="week">Эта неделя</option>
              <option value="month">Этот месяц</option>
              <option value="year">Этот год</option>
            </Select>
          </Box>
  
          {isLoading ? (
            <Flex justify="center" align="center" height="200px">
              <Spinner size="xl" />
            </Flex>
          ) : data.length > 0 ? (
            <AnimatePresence>
              {[
                <motion.div
                  key="circular-charts"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card borderRadius="xl" bg="#FFFFFF">
                    <CardHeader>
                      <Heading size="md" fontFamily={"Open Sans Regular"} color="#000000">
                        Ваш баланс жизни за {period === 'week' ? 'эту неделю' : period === 'month' ? 'этот месяц' : 'этот год'}
                      </Heading>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={[2, 3, 4]} spacing={4}>
                        {data.map((item, index) => (
                          <CircularProgressChart
                            key={item.aspect}
                            value={item.rating}
                            max={5}
                            label={item.aspect}
                            color={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                </motion.div>,
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Card borderRadius="xl" bg="#FFFFFF">
                    <CardHeader>
                      <Heading size="md" fontFamily={"Open Sans Regular"} color="#000000">Сводка на {period === 'week' ? 'эту неделю' : period === 'month' ? 'этот месяц' : 'этот год'}</Heading>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={1} spacing={4}>
                        <Box>
                          <Text fontWeight="medium" color="#000000">Средняя оценка</Text>
                          <Text fontSize="2xl" fontWeight="bold" color="#000000">
                            {averageRating}
                          </Text>
                        </Box>
                        {highestRated && (
                          <Box>
                            <Text fontWeight="medium" color="#000000">Лучшая цель</Text>
                            <Badge variant="subtle" colorScheme="green" mt={1}>
                              {highestRated.aspect} ({highestRated.rating})
                            </Badge>
                          </Box>
                        )}
                        {lowestRated && (
                          <Box>
                            <Text fontWeight="medium" color="#000000">Стоит поработать</Text>
                            <Badge variant="subtle" colorScheme="red" mt={1}>
                              {lowestRated.aspect} ({lowestRated.rating})
                            </Badge>
                          </Box>
                        )}
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                </motion.div>,
                <motion.div
                  key="detailed-data"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Card borderRadius="xl" bg="#FFFFFF">
                    <CardHeader>
                      <Heading size="md" fontFamily={"Open Sans Regular"} color="#000000">Подробные данные за {period === 'week' ? 'эту неделю' : period === 'month' ? 'этот месяц' : 'этот год'}</Heading>
                    </CardHeader>
                    <CardBody>
                      <List spacing={2}>
                        {data.map((item) => (
                          <ListItem key={item.aspect}>
                            <Flex justify="space-between" align="center">
                              <Text color="#000000">{item.aspect}</Text>
                              <Badge variant="outline" colorScheme='green'>{item.rating}/5</Badge>
                            </Flex>
                          </ListItem>
                        ))}
                      </List>
                    </CardBody>
                  </Card>
                </motion.div>
              ]}
            </AnimatePresence>
          ) : (
            <Card borderRadius="xl" bg="#FFFFFF">
              <CardBody>
                <Text color="#000000">Нет данных для отображения за выбранный период.</Text>
              </CardBody>
            </Card>
          )}
        </VStack>
      </Box>
    </Layout>
  );
};