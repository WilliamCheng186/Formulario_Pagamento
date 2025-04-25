export interface Cliente {
  cod_cli: number;
  tipo_cliente: 'Pessoa Física' | 'Pessoa Jurídica';
  nome: string;
  cpf_cnpj: string;
  rg_ie: string | null;
  email: string | null;
  telefone: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  estado: number;
  cidade: number;
  ativo: boolean;
  estado_nome?: string;
  cidade_nome?: string;
}

export interface Estado {
  cod_est: number;
  nome: string;
  uf: string;
  cod_pais: number;
}

export interface Cidade {
  cod_cid: number;
  nome: string;
  cod_est: number;
}

export interface Pais {
  cod_pais: number;
  nome: string;
  sigla: string;
}

export interface CondicaoPagamento {
  cod_pagto: number;
  descricao: string;
  dias: number;
}

export interface FormaPagamento {
  cod_forma: number;
  descricao: string;
  ativo: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
} 
  cod_cli: number;
  tipo_cliente: 'Pessoa Física' | 'Pessoa Jurídica';
  nome: string;
  cpf_cnpj: string;
  rg_ie: string | null;
  email: string | null;
  telefone: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  estado: number;
  cidade: number;
  ativo: boolean;
  estado_nome?: string;
  cidade_nome?: string;
}

export interface Estado {
  cod_est: number;
  nome: string;
  uf: string;
  cod_pais: number;
}

export interface Cidade {
  cod_cid: number;
  nome: string;
  cod_est: number;
}

export interface Pais {
  cod_pais: number;
  nome: string;
  sigla: string;
}

export interface CondicaoPagamento {
  cod_pagto: number;
  descricao: string;
  dias: number;
}

export interface FormaPagamento {
  cod_forma: number;
  descricao: string;
  ativo: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
} 
  cod_cli: number;
  tipo_cliente: 'Pessoa Física' | 'Pessoa Jurídica';
  nome: string;
  cpf_cnpj: string;
  rg_ie: string | null;
  email: string | null;
  telefone: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  estado: number;
  cidade: number;
  ativo: boolean;
  estado_nome?: string;
  cidade_nome?: string;
}

export interface Estado {
  cod_est: number;
  nome: string;
  uf: string;
  cod_pais: number;
}

export interface Cidade {
  cod_cid: number;
  nome: string;
  cod_est: number;
}

export interface Pais {
  cod_pais: number;
  nome: string;
  sigla: string;
}

export interface CondicaoPagamento {
  cod_pagto: number;
  descricao: string;
  dias: number;
}

export interface FormaPagamento {
  cod_forma: number;
  descricao: string;
  ativo: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
} 
  cod_cli: number;
  tipo_cliente: 'Pessoa Física' | 'Pessoa Jurídica';
  nome: string;
  cpf_cnpj: string;
  rg_ie: string | null;
  email: string | null;
  telefone: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  estado: number;
  cidade: number;
  ativo: boolean;
  estado_nome?: string;
  cidade_nome?: string;
}

export interface Estado {
  cod_est: number;
  nome: string;
  uf: string;
  cod_pais: number;
}

export interface Cidade {
  cod_cid: number;
  nome: string;
  cod_est: number;
}

export interface Pais {
  cod_pais: number;
  nome: string;
  sigla: string;
}

export interface CondicaoPagamento {
  cod_pagto: number;
  descricao: string;
  dias: number;
}

export interface FormaPagamento {
  cod_forma: number;
  descricao: string;
  ativo: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
} 