import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const NavBar = styled.nav`
  background: #2563eb;
  color: white;
  padding: 16px;
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
  &:hover {
    background: #1d4ed8;
  }
`;

const Navigation = () => {
  return (
      <NavBar>
        <NavContainer>
          <NavLink to="/">Багатофакторна лінійна регресія</NavLink>
          <div>
            <NavLink to="/">Головна</NavLink>
          </div>
        </NavContainer>
      </NavBar>
  );
};

export default Navigation;
