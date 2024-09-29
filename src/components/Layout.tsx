import React, { FC } from 'react';
import { Box, Flex, Heading, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from '@chakra-ui/react';
import { Crown, Bell, Home, Target, BarChart3 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createInvoiceLink } from '../../backend/starsAPI';

interface LayoutProps {
  children: React.ReactNode;
  userId: string | null;
}

const Tabbar: FC<{ children: React.ReactNode }> = ({ children }) => (
  <Flex
    as="nav"
    position="fixed"
    bottom={0}
    left={0}
    right={0}
    bg="#FFFFFF"
    justifyContent="space-around"
    py={2}
    borderTopWidth={1} 
    borderTopColor="var(--tg-theme-hint-color)" 
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

export const Layout: FC<LayoutProps> = ({ children, userId }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const navigate = useNavigate();
  const location = useLocation();

  const handleBuyPremium = async () => {
    if (!userId) return;
    onOpen();
  }
  
  const handleConfirmPurchase = async () => {
    if (!userId) return;
    await createInvoiceLink('Полный доступ', 'Возможность создавать до 15 целей', userId, [{label: 'Full access', amount: 50}]);
    onClose();
  }

  const handleOpenReminders = () => {
    navigate('/reminders');
  }

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
        bg="#FFFFFF" 
        w="full" 
        position="fixed" 
        top={0} 
        left={0} 
        justify="space-between" 
        align="center" 
        p={4} 
        borderBottomWidth={1} 
        borderBottomColor="var(--tg-theme-hint-color)" 
        zIndex={10}
      >
        <Box onClick={handleBuyPremium} cursor="pointer">
          <Crown size={24} color="#ffd700" />
        </Box>
        <Heading fontSize="2xl" color="#000000" style={{letterSpacing: 0.1}} fontFamily={"Open Sans Regular, Erewhon Regular"}>Баланс жизни</Heading>
        <Box onClick={handleOpenReminders} cursor="pointer">
          <Bell size={24} color="var(--tg-theme-hint-color)" />
        </Box>
      </Flex>

      {children}

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
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="#FFFFFF" color="#000000" maxWidth="90%">
          <ModalHeader>Полная версия</ModalHeader>
          <ModalBody>
            <Text>
              Приобретая полную версию, вы получите возможность создавать до 15 целей для отслеживания.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleConfirmPurchase}>
              Купить за 50 ⭐
            </Button>
            <Button variant="ghost" onClick={onClose}>Отмена</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};