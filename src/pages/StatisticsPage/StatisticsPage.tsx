import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
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
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Crown, User, Home, Target, BarChart3 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

//@ts-ignore
import { getStatistics } from '../../../backend/databaseAPI';
import { authorizeUser } from '../../../backend/telegramAuth';
import { createInvoiceLink } from '../../../backend/starsAPI';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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

const Tabbar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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

const TabbarItem: React.FC<{ children: React.ReactNode; text: string; selected?: boolean; onClick: () => void }> = ({ children, text, selected = false, onClick }) => (
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

export const StatisticsPage: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

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

  const handleBuyPremium = async () => {
    if (!userId) return;
    await createInvoiceLink('Полный доступ', 'Возможность создавать до 15 целей', userId, [{label: 'Full access', amount: 1}]);
  }

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
    <Flex
      direction="column"
      align="center"
      justify="center"
      minH="100vh"
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
        <Box onClick={handleBuyPremium} cursor="pointer">
          <Crown size={24} color="#ffd700" />
        </Box>
        <Heading fontSize="2xl" color="var(--tg-theme-text-color)" style={{letterSpacing: 0.1}} fontFamily={"Open Sans Regular, Erewhon Regular"}>Баланс жизни</Heading>
        <User size={24} color="var(--tg-theme-hint-color)" />
      </Flex>
  
      <Box 
        w="full" 
        maxW="100%" 
        mt="80px"
        mb="80px"
        borderRadius="xl"
        opacity={contentLoaded ? 1 : 0}
        maxHeight={contentLoaded ? "2000px" : "0px"}
        transition="opacity 0.5s ease-in-out, max-height 0.5s ease-in-out"
        overflow="hidden"
      >
        <VStack spacing={6} align="stretch" px={4} pb="40px" fontFamily={"Open Sans Regular"}>
          <Box bg="var(--tg-theme-bg-color)" borderRadius="xl" p={4} boxShadow="md">
            <Text as="h2" size="md" mb={2} fontFamily={"Open Sans Regular"}>
              Выберите временной промежуток
            </Text>
            <Select value={period} onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'year')}>
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
                  key="pie-chart"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card borderRadius="xl" bg="var(--tg-theme-bg-color)">
                    <CardHeader>
                      <Heading size="md" fontFamily={"Open Sans Regular"} color="var(--tg-theme-text-color)">Ваш баланс жизни за {period === 'week' ? 'эту неделю' : period === 'month' ? 'этот месяц' : 'этот год'}</Heading>
                    </CardHeader>
                    <CardBody>
                      <Box h="400px"> {/* Increased height to accommodate legend */}
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data}
                              cx="50%"
                              cy="50%"
                              innerRadius="60%"
                              outerRadius="80%"
                              paddingAngle={5}
                              dataKey="rating"
                              nameKey="aspect"
                            >
                              {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend 
                              layout="vertical" 
                              align="center" 
                              verticalAlign="bottom"
                              wrapperStyle={{ fontSize: '12px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
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
                  <Card borderRadius="xl" bg="var(--tg-theme-bg-color)">
                    <CardHeader>
                      <Heading size="md" fontFamily={"Open Sans Regular"} color="var(--tg-theme-text-color)">Сводка на {period === 'week' ? 'эту неделю' : period === 'month' ? 'этот месяц' : 'этот год'}</Heading>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={1} spacing={4}>
                        <Box>
                          <Text fontWeight="medium" color="var(--tg-theme-text-color)">Средняя оценка</Text>
                          <Text fontSize="2xl" fontWeight="bold" color="var(--tg-theme-text-color)">
                            {averageRating}
                          </Text>
                        </Box>
                        {highestRated && (
                          <Box>
                            <Text fontWeight="medium" color="var(--tg-theme-text-color)">Лучшая цель</Text>
                            <Badge variant="subtle" colorScheme="green" mt={1}>
                              {highestRated.aspect} ({highestRated.rating})
                            </Badge>
                          </Box>
                        )}
                        {lowestRated && (
                          <Box>
                            <Text fontWeight="medium" color="var(--tg-theme-text-color)">Стоит поработать</Text>
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
                  <Card borderRadius="xl" bg="var(--tg-theme-bg-color)">
                    <CardHeader>
                      <Heading size="md" fontFamily={"Open Sans Regular"} color="var(--tg-theme-text-color)">Подробные данные за {period === 'week' ? 'эту неделю' : period === 'month' ? 'этот месяц' : 'этот год'}</Heading>
                    </CardHeader>
                    <CardBody>
                      <List spacing={2}>
                        {data.map((item) => (
                          <ListItem key={item.aspect}>
                            <Flex justify="space-between" align="center">
                              <Text color="var(--tg-theme-text-color)">{item.aspect}</Text>
                              <Badge variant="outline">{item.rating}/5</Badge>
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
            <Card borderRadius="xl" bg="var(--tg-theme-bg-color)">
              <CardBody>
                <Text color="var(--tg-theme-text-color)">Нет данных для отображения за выбранный период.</Text>
              </CardBody>
            </Card>
          )}
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